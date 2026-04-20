import L from 'leaflet';
import { useMap } from 'react-leaflet';
import car from '../../assets/logo.png';
import { useEffect, useRef, useCallback, useState } from 'react';

const OSRM_MATCH_URL = 'https://router.project-osrm.org/match/v1/driving';
const BATCH_SIZE = 80; // OSRM limit is 100, keep some margin
const MATCH_RADIUS = 25; // meters – how far a GPS point can be from a road

/**
 * Snap an array of [lat, lng, speed] GPS points to actual roads via OSRM Match API.
 * Returns an array of [lat, lng] for the road-snapped polyline.
 * Falls back to raw coordinates on error.
 */
async function snapToRoads(coordinates) {
  if (!coordinates?.length || coordinates.length < 2) return coordinates.map((c) => [c[0], c[1]]);

  // Split coordinates into overlapping batches so seams connect properly
  const batches = [];
  for (let i = 0; i < coordinates.length; i += BATCH_SIZE - 1) {
    batches.push(coordinates.slice(i, Math.min(i + BATCH_SIZE, coordinates.length)));
  }

  const snappedPath = [];

  for (let bIdx = 0; bIdx < batches.length; bIdx++) {
    const batch = batches[bIdx];
    if (batch.length < 2) {
      // Need at least 2 points for OSRM
      snappedPath.push([batch[0][0], batch[0][1]]);
      continue;
    }

    try {
      // OSRM expects lng,lat order
      const coordStr = batch.map((c) => `${c[1]},${c[0]}`).join(';');
      const radiuses = batch.map(() => MATCH_RADIUS).join(';');
      const url = `${OSRM_MATCH_URL}/${coordStr}?overview=full&geometries=geojson&radiuses=${radiuses}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.matchings?.length > 0) {
        for (const matching of data.matchings) {
          const geojsonCoords = matching.geometry.coordinates;
          // GeoJSON is [lng, lat] → convert to [lat, lng]
          const latLngs = geojsonCoords.map((c) => [c[1], c[0]]);

          // Skip first point of subsequent batches to avoid duplicate at seam
          const startIdx = snappedPath.length > 0 ? 1 : 0;
          for (let i = startIdx; i < latLngs.length; i++) {
            snappedPath.push(latLngs[i]);
          }
        }
      } else {
        // Fallback: use raw GPS points for this batch
        const startIdx = snappedPath.length > 0 ? 1 : 0;
        for (let i = startIdx; i < batch.length; i++) {
          snappedPath.push([batch[i][0], batch[i][1]]);
        }
      }
    } catch {
      // Fallback: use raw GPS points for this batch
      const startIdx = snappedPath.length > 0 ? 1 : 0;
      for (let i = startIdx; i < batch.length; i++) {
        snappedPath.push([batch[i][0], batch[i][1]]);
      }
    }
  }

  return snappedPath;
}

/**
 * For a snapped path point, find the nearest original GPS point to get its speed value.
 */
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
  const polylineRef = useRef();
  const sourceMarkerRef = useRef();
  const destMarkerRef = useRef();
  const intervalRef = useRef();
  const posRef = useRef(0);
  const [snappedCoords, setSnappedCoords] = useState([]);

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

  // Clean up all map layers
  const cleanup = useCallback(() => {
    clearInterval(intervalRef.current);
    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
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

  // Snap GPS coordinates to roads when raw coordinates change
  useEffect(() => {
    if (!coordinates?.length || coordinates.length < 2) {
      Promise.resolve().then(() => setSnappedCoords([]));
      return;
    }

    let cancelled = false;

    snapToRoads(coordinates).then((snapped) => {
      if (!cancelled && snapped.length >= 2) {
        setSnappedCoords(snapped);
      } else if (!cancelled) {
        // Fallback if snapping returned too few points
        setSnappedCoords(coordinates.map((c) => [c[0], c[1]]));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [coordinates]);

  // Draw route polyline + markers when snapped coordinates are ready
  useEffect(() => {
    if (!map || !snappedCoords?.length || snappedCoords.length < 2) return;

    cleanup();

    // Draw polyline along road-snapped path
    polylineRef.current = L.polyline(snappedCoords, {
      color: '#4285f4',
      weight: 5,
      opacity: 1,
      smoothFactor: 1,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Fit map bounds to polyline
    map.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50], maxZoom: 16 });

    const first = snappedCoords[0];
    const last = snappedCoords[snappedCoords.length - 1];

    // Source marker (green circle)
    sourceMarkerRef.current = L.marker([first[0], first[1]], { icon: getSourceIcon(), zIndexOffset: 1000 }).addTo(map);

    // Destination marker (red square)
    destMarkerRef.current = L.marker([last[0], last[1]], { icon: getDestIcon(), zIndexOffset: 1000 }).addTo(map);

    // Vehicle marker at start position
    const startSpeed = coordinates?.length ? findNearestSpeed(first[0], first[1], coordinates) : 0;
    markerRef.current = L.marker([first[0], first[1]], { icon: getCarIcon(), zIndexOffset: 2000 })
      .addTo(map)
      .bindPopup(popHtml(first[0], first[1], startSpeed), { closeButton: false, autoClose: false })
      .openPopup();

    posRef.current = 0;

    return cleanup;
  }, [map, snappedCoords, vehicle_number, popHtml, cleanup, coordinates]);

  // Handle play/pause animation along snapped path
  useEffect(() => {
    if (!snappedCoords?.length || snappedCoords.length < 2) return;

    clearInterval(intervalRef.current);

    if (!markerRef.current) return;
    markerRef.current.setIcon(getCarIcon());

    if (isPlaying) {
      if (posRef.current >= snappedCoords.length) posRef.current = 0;
      const delay = Math.max(10, 1000 / Math.max(speed, 1));

      intervalRef.current = setInterval(() => {
        if (posRef.current >= snappedCoords.length) {
          clearInterval(intervalRef.current);
          return;
        }
        const [lat, lng] = snappedCoords[posRef.current];
        const currentSpeed = coordinates?.length ? findNearestSpeed(lat, lng, coordinates) : 0;
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setPopupContent(popHtml(lat, lng, currentSpeed));
        posRef.current++;
      }, delay);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, snappedCoords, coordinates, popHtml]);

  return null;
};

export default RoutingMatching;
