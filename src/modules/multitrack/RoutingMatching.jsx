import L from 'leaflet';
import { useMap } from 'react-leaflet';
import car from '../../assets/logo.png';
import { useEffect, useMemo, useRef, useCallback, useState } from 'react';

const OSRM_MATCH_URL = 'https://router.project-osrm.org/match/v1/driving';
const BATCH_SIZE = 80; // OSRM hard limit is 100, keep some margin

// A trip is split into a new "segment" whenever consecutive GPS fixes are
// separated by more than one of these thresholds. The OSRM Match API cannot
// meaningfully snap across such gaps — asking it to do so produces the
// "straight line through a field" artefact the client reported.
const GAP_TIME_SEC = 60;
const GAP_DIST_M = 300;

// Haversine distance (metres) between two [lat, lng] points.
function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Adaptive match radius: faster points get a wider snap window because the
// tracker error plus the time-to-next-fix means a larger positional envelope.
// Capped at 100 m so we don't snap onto parallel roads.
function radiusForPoint(speedKmh) {
  const s = Number(speedKmh) || 0;
  return Math.round(Math.max(30, Math.min(100, s * 1.5)));
}

function splitIntoSegments(coords) {
  if (!coords?.length) return [];
  const segments = [];
  let current = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    const prev = current[current.length - 1];
    const cur = coords[i];
    const dt = prev[3] && cur[3] ? (cur[3] - prev[3]) / 1000 : 0;
    const dd = haversineMeters(prev, cur);
    if ((dt && dt > GAP_TIME_SEC) || dd > GAP_DIST_M) {
      segments.push(current);
      current = [cur];
    } else {
      current.push(cur);
    }
  }
  if (current.length) segments.push(current);
  return segments;
}

async function snapBatch(batch, accumulator) {
  // OSRM expects lng,lat order.
  const coordStr = batch.map((c) => `${c[1]},${c[0]}`).join(';');
  const radiuses = batch.map((c) => radiusForPoint(c[2])).join(';');
  const haveTimestamps = batch.every((c) => Number.isFinite(c[3]));
  const timestamps = haveTimestamps ? batch.map((c) => Math.floor(c[3] / 1000)).join(';') : null;

  let url = `${OSRM_MATCH_URL}/${coordStr}?overview=full&geometries=geojson&tidy=true&gaps=split&radiuses=${radiuses}`;
  if (timestamps) url += `&timestamps=${timestamps}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.matchings?.length) {
      for (const matching of data.matchings) {
        if (!matching?.geometry?.coordinates?.length) continue;
        const latLngs = matching.geometry.coordinates.map((c) => [c[1], c[0]]);
        const startIdx = accumulator.length > 0 ? 1 : 0;
        for (let i = startIdx; i < latLngs.length; i++) accumulator.push(latLngs[i]);
      }
      return true;
    }
  } catch {
    // fall through to fallback below
  }
  const startIdx = accumulator.length > 0 ? 1 : 0;
  for (let i = startIdx; i < batch.length; i++) accumulator.push([batch[i][0], batch[i][1]]);
  return false;
}

async function snapSegment(segment) {
  if (!segment?.length) return { coords: [], snapped: false };
  if (segment.length < 2) {
    return { coords: [[segment[0][0], segment[0][1]]], snapped: false };
  }

  const batches = [];
  for (let i = 0; i < segment.length; i += BATCH_SIZE - 1) {
    batches.push(segment.slice(i, Math.min(i + BATCH_SIZE, segment.length)));
  }

  const snapped = [];
  let allOk = true;
  for (const batch of batches) {
    if (batch.length < 2) {
      const startIdx = snapped.length > 0 ? 1 : 0;
      for (let i = startIdx; i < batch.length; i++) snapped.push([batch[i][0], batch[i][1]]);
      allOk = false;
      continue;
    }
    const ok = await snapBatch(batch, snapped);
    if (!ok) allOk = false;
  }
  return { coords: snapped, snapped: allOk };
}

async function buildRoute(coordinates) {
  const segments = splitIntoSegments(coordinates);
  const snapped = [];
  for (const seg of segments) {
    const result = await snapSegment(seg);
    if (result.coords.length) snapped.push(result);
  }
  return snapped;
}

function findNearestSpeed(lat, lng, originalCoords) {
  let minDist = Infinity;
  let speed = 0;
  for (const c of originalCoords) {
    const dLat = c[0] - lat;
    const dLng = c[1] - lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < minDist) {
      minDist = dist;
      speed = c[2] ?? 0;
    }
  }
  return speed;
}

const RoutingMatching = ({ coordinates, speed, isPlaying, vehicle_number }) => {
  const map = useMap();
  const markerRef = useRef();
  const polylineRefs = useRef([]);
  const sourceMarkerRef = useRef();
  const destMarkerRef = useRef();
  const intervalRef = useRef();
  const posRef = useRef(0);
  const [route, setRoute] = useState([]); // [{ coords: [[lat,lng],...], snapped: bool }]

  const getSourceIcon = () =>
    L.divIcon({
      html: '<div style="width:14px;height:14px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      className: '',
    });

  const getDestIcon = () =>
    L.divIcon({
      html: '<div style="width:14px;height:14px;border-radius:2px;background:#db4437;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      className: '',
    });

  const getCarIcon = () =>
    L.icon({
      iconUrl: typeof car === 'string' ? car : car?.default || '',
      iconSize: [30, 35],
      iconAnchor: [15, 34],
      popupAnchor: [0, -34],
      className: 'bg-white',
    });

  const popHtml = useCallback(
    (lat, lng, currentSpeed) =>
      `<div style="min-width:180px;padding:0px;font-family:system-ui,sans-serif;">
        <div style="background:#4285f4;color:#fff;padding:6px 10px;border-radius:6px 6px 0 0;font-size:13px;font-weight:600;letter-spacing:0.3px;">
          ${vehicle_number || 'Vehicle'}
        </div>
        <div style="padding:8px 10px;background:#fff;border-radius:0 0 6px 6px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;">
            <span style="color:#6b7280;">Speed</span>
            <span style="color:#1f2937;font-weight:500;">${currentSpeed != null ? Number(currentSpeed) + ' km/h' : '0 km/h'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px;">
            <span style="color:#6b7280;">Latitude</span>
            <span style="color:#1f2937;font-weight:500;">${lat != null ? Number(lat).toFixed(6) : 'N/A'}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;">
            <span style="color:#6b7280;">Longitude</span>
            <span style="color:#1f2937;font-weight:500;">${lng != null ? Number(lng).toFixed(6) : 'N/A'}</span>
          </div>
        </div>
      </div>`,
    [vehicle_number],
  );

  const cleanup = useCallback(() => {
    clearInterval(intervalRef.current);
    for (const pl of polylineRefs.current) {
      if (pl) map.removeLayer(pl);
    }
    polylineRefs.current = [];
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    if (sourceMarkerRef.current) {
      map.removeLayer(sourceMarkerRef.current);
      sourceMarkerRef.current = null;
    }
    if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }
  }, [map]);

  // Build the route (segments + snapping) whenever raw coordinates change.
  useEffect(() => {
    if (!coordinates?.length || coordinates.length < 2) {
      setRoute([]);
      return;
    }

    let cancelled = false;

    buildRoute(coordinates).then((built) => {
      if (cancelled) return;
      if (built.length) setRoute(built);
      else setRoute([{ coords: coordinates.map((c) => [c[0], c[1]]), snapped: false }]);
    });

    return () => {
      cancelled = true;
    };
  }, [coordinates]);

  // Flat animation path: concatenate all segment coords, interpolating a few
  // points across each gap so the car marker transitions smoothly rather than
  // teleporting. The interpolated gap points are NOT drawn as a solid road —
  // the gap polyline below shows a dashed line so the user sees the trace is
  // approximate over that span.
  const animationPath = useMemo(() => {
    const arr = [];
    for (let i = 0; i < route.length; i++) {
      const seg = route[i];
      if (i > 0) {
        const prev = route[i - 1].coords;
        const a = prev[prev.length - 1];
        const b = seg.coords[0];
        if (a && b) {
          const STEPS = 8;
          for (let s = 1; s < STEPS; s++) {
            const t = s / STEPS;
            arr.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
          }
        }
      }
      for (const c of seg.coords) arr.push(c);
    }
    return arr;
  }, [route]);

  // Render segments + gap lines + markers when route updates.
  useEffect(() => {
    if (!map || !route.length) return;

    cleanup();

    const allBoundsPoints = [];

    for (let i = 0; i < route.length; i++) {
      const seg = route[i];
      if (seg.coords.length >= 2) {
        const pl = L.polyline(seg.coords, {
          color: seg.snapped ? '#4285f4' : '#f59e0b', // amber if we couldn't snap this segment
          weight: 5,
          opacity: 1,
          smoothFactor: 1,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: seg.snapped ? null : '6 8',
        }).addTo(map);
        polylineRefs.current.push(pl);
        allBoundsPoints.push(...seg.coords);
      }

      if (i > 0) {
        const prev = route[i - 1].coords;
        const a = prev[prev.length - 1];
        const b = seg.coords[0];
        if (a && b) {
          const gap = L.polyline([a, b], {
            color: '#9ca3af',
            weight: 4,
            opacity: 0.9,
            dashArray: '2 10',
            lineCap: 'round',
          }).addTo(map);
          polylineRefs.current.push(gap);
          allBoundsPoints.push(a, b);
        }
      }
    }

    if (allBoundsPoints.length >= 2) {
      const bounds = L.latLngBounds(allBoundsPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }

    const first = route[0].coords[0];
    const lastSeg = route[route.length - 1].coords;
    const last = lastSeg[lastSeg.length - 1];

    if (first) {
      sourceMarkerRef.current = L.marker([first[0], first[1]], {
        icon: getSourceIcon(),
        zIndexOffset: 1000,
      }).addTo(map);
    }

    if (last) {
      destMarkerRef.current = L.marker([last[0], last[1]], {
        icon: getDestIcon(),
        zIndexOffset: 1000,
      }).addTo(map);
    }

    if (first) {
      const startSpeed = coordinates?.length ? findNearestSpeed(first[0], first[1], coordinates) : 0;
      markerRef.current = L.marker([first[0], first[1]], { icon: getCarIcon(), zIndexOffset: 2000 })
        .addTo(map)
        .bindPopup(popHtml(first[0], first[1], startSpeed), { closeButton: false, autoClose: false })
        .openPopup();
    }

    posRef.current = 0;

    return cleanup;
  }, [map, route, vehicle_number, popHtml, cleanup, coordinates]);

  // Play / pause animation along the full interpolated path.
  useEffect(() => {
    if (!animationPath.length || animationPath.length < 2) return;

    clearInterval(intervalRef.current);

    if (!markerRef.current) return;
    markerRef.current.setIcon(getCarIcon());

    if (isPlaying) {
      if (posRef.current >= animationPath.length) posRef.current = 0;
      const delay = Math.max(10, 1000 / Math.max(speed, 1));

      intervalRef.current = setInterval(() => {
        if (posRef.current >= animationPath.length) {
          clearInterval(intervalRef.current);
          return;
        }
        const [lat, lng] = animationPath[posRef.current];
        const currentSpeed = coordinates?.length ? findNearestSpeed(lat, lng, coordinates) : 0;
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setPopupContent(popHtml(lat, lng, currentSpeed));
        posRef.current++;
      }, delay);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, animationPath, coordinates, popHtml]);

  return null;
};

export default RoutingMatching;
