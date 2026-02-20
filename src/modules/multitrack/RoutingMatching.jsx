import L from 'leaflet';
import 'leaflet-routing-machine';
import { useMap } from 'react-leaflet';
import car from '../../assets/logo.png';
import { useEffect, useRef, useCallback } from 'react';

const RoutingMatching = ({ coordinates, speed, isPlaying, vehicle_number }) => {
  const map = useMap();
  const markerRef = useRef(),
    routingRef = useRef(),
    intervalRef = useRef();
  const routeCoords = useRef([]),
    posRef = useRef(0);

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
      `<h1 style="font-size:1rem; font-weight:bold;">${vehicle_number || ''}</h1>
        <div>Lat: ${lat != null ? lat.toFixed(7) : 'N/A'}</div>
        <div>Lng: ${lng != null ? lng.toFixed(7) : 'N/A'}</div>`,
    [vehicle_number],
  );

  useEffect(() => {
    if (!map || coordinates?.length < 2) return;
    if (routingRef.current) map.removeControl(routingRef.current);
    if (markerRef.current) map.removeLayer(markerRef.current);
    routingRef.current = markerRef.current = null;

    const routing = L.Routing.control({
      waypoints: coordinates.map(([lat, lng]) => L.latLng(lat, lng)),
      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null,
      lineOptions: { styles: [{ color: 'red', opacity: 0.7, weight: 5 }] },
    }).addTo(map);

    routingRef.current = routing;
    const el = document.querySelector('.leaflet-top.leaflet-right');
    if (el) el.style.display = 'none';

    routing.on('routesfound', (e) => {
      routeCoords.current = e.routes[0]?.coordinates || [];
      posRef.current = 0;
      if (markerRef.current) map.removeLayer(markerRef.current);
      if (routeCoords.current.length) {
        const { lat, lng } = routeCoords.current[0];
        markerRef.current = L.marker(routeCoords.current[0], { icon: getCarIcon() })
          .addTo(map)
          .bindPopup(popHtml(lat, lng), { closeButton: false, autoClose: false })
          .openPopup();
      }
    });

    return () => {
      routing.off('routesfound');
      map.removeControl(routing);
      if (markerRef.current) map.removeLayer(markerRef.current);
      clearInterval(intervalRef.current);
    };
  }, [map, coordinates, vehicle_number, popHtml]);

  useEffect(() => {
    const coords = routeCoords.current;
    if (!coords.length) return;

    if (!markerRef.current) {
      const { lat, lng } = coords[0] || {};
      markerRef.current = L.marker(coords[0], { icon: getCarIcon() })
        .addTo(map)
        .bindPopup(popHtml(lat, lng), { closeButton: false, autoClose: false })
        .openPopup();
    } else markerRef.current.setIcon(getCarIcon());

    clearInterval(intervalRef.current);

    if (isPlaying) {
      if (posRef.current >= coords.length) posRef.current = 0;
      const delay = Math.max(10, 1000 / Math.max(speed, 1));
      intervalRef.current = setInterval(() => {
        if (posRef.current >= coords.length) {
          clearInterval(intervalRef.current);
          return;
        }
        const { lat, lng } = coords[posRef.current];
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setPopupContent(popHtml(lat, lng));
        posRef.current++;
      }, delay);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, map, vehicle_number, popHtml]);

  return null;
};

export default RoutingMatching;
