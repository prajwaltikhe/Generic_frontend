import L from 'leaflet';
import { useMap } from 'react-leaflet';
import car from '../../assets/logo.png';
import { useEffect, useRef, useCallback } from 'react';

const RoutingMatching = ({ coordinates, speed, isPlaying, vehicle_number }) => {
  const map = useMap();
  const markerRef = useRef();
  const polylineRef = useRef();
  const sourceMarkerRef = useRef();
  const destMarkerRef = useRef();
  const intervalRef = useRef();
  const posRef = useRef(0);

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
    (lat, lng) =>
      `<div style="min-width:180px;padding:0px;font-family:system-ui,sans-serif;">
        <div style="background:#4285f4;color:#fff;padding:6px 10px;border-radius:6px 6px 0 0;font-size:13px;font-weight:600;letter-spacing:0.3px;">
          ${vehicle_number || 'Vehicle'}
        </div>
        <div style="padding:8px 10px;background:#fff;border-radius:0 0 6px 6px;">
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

  // Draw route polyline + markers when coordinates change
  useEffect(() => {
    if (!map || !coordinates?.length || coordinates.length < 2) return;

    cleanup();

    // Draw polyline directly from GPS coordinates
    polylineRef.current = L.polyline(coordinates, {
      color: '#4285f4',
      weight: 5,
      opacity: 1,
      smoothFactor: 1,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    // Fit map bounds to polyline
    map.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50], maxZoom: 16 });

    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];

    // Source marker (black circle)
    sourceMarkerRef.current = L.marker(first, { icon: getSourceIcon(), zIndexOffset: 1000 }).addTo(map);

    // Destination marker (black square)
    destMarkerRef.current = L.marker(last, { icon: getDestIcon(), zIndexOffset: 1000 }).addTo(map);

    // Vehicle marker at start position
    markerRef.current = L.marker(first, { icon: getCarIcon(), zIndexOffset: 2000 })
      .addTo(map)
      .bindPopup(popHtml(first[0], first[1]), { closeButton: false, autoClose: false })
      .openPopup();

    posRef.current = 0;

    return cleanup;
  }, [map, coordinates, vehicle_number, popHtml, cleanup]);

  // Handle play/pause animation
  useEffect(() => {
    if (!coordinates?.length || coordinates.length < 2) return;

    clearInterval(intervalRef.current);

    if (!markerRef.current) return;
    markerRef.current.setIcon(getCarIcon());

    if (isPlaying) {
      if (posRef.current >= coordinates.length) posRef.current = 0;
      const delay = Math.max(10, 1000 / Math.max(speed, 1));

      intervalRef.current = setInterval(() => {
        if (posRef.current >= coordinates.length) {
          clearInterval(intervalRef.current);
          return;
        }
        const [lat, lng] = coordinates[posRef.current];
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setPopupContent(popHtml(lat, lng));
        posRef.current++;
      }, delay);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, coordinates, popHtml]);

  return null;
};

export default RoutingMatching;
