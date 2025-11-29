import L from 'leaflet';
import 'leaflet-routing-machine';
import { useMap } from 'react-leaflet';
import car from '../../assets/logo.png';
import { useEffect, useRef } from 'react';

const RoutingMatching = ({ coordinates, speed, isPlaying }) => {
  const map = useMap();
  const markerRef = useRef();
  const intervalRef = useRef();
  const routeRef = useRef([]);
  const posRef = useRef(0);

  useEffect(() => {
    if (!map || !coordinates?.length || coordinates.length < 2) return;
    let routing = L.Routing.control({
      waypoints: coordinates.map(([lat, lng]) => L.latLng(lat, lng)),
      routeWhileDragging: false,
      addWaypoints: false,
      createMarker: () => null,
    }).addTo(map);

    const hidePanel = () => {
      const el = document.querySelector('.leaflet-top.leaflet-right');
      if (el) el.style.display = 'none';
    };

    const onRoute = (e) => {
      routeRef.current = e.routes[0]?.coordinates || [];
      posRef.current = 0;
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };

    routing.on('routesfound', onRoute);
    hidePanel();

    return () => {
      routing.off('routesfound', onRoute);
      map.removeControl(routing);
      if (markerRef.current) map.removeLayer(markerRef.current);
      clearInterval(intervalRef.current);
    };
  }, [map, coordinates]);

  useEffect(() => {
    if (!routeRef.current.length) return;
    if (markerRef.current == null) {
      markerRef.current = L.marker(routeRef.current[0], {
        icon: L.icon({ iconUrl: car, iconSize: [25, 30] }),
      })
        .addTo(map)
        .bindPopup('', { closeButton: false, autoClose: false })
        .openPopup();
    }
    clearInterval(intervalRef.current);

    if (isPlaying) {
      if (posRef.current >= routeRef.current.length) posRef.current = 0;
      const delay = Math.max(10, 1000 / (speed || 1));
      intervalRef.current = setInterval(() => {
        const coords = routeRef.current;
        if (posRef.current >= coords.length) return clearInterval(intervalRef.current);
        const { lat, lng } = coords[posRef.current];
        markerRef.current.setLatLng([lat, lng]);
        markerRef.current.setPopupContent(
          `<div><strong>Lat:</strong> ${lat.toFixed(5)}<br/><strong>Lng:</strong> ${lng.toFixed(5)}</div>`
        );
        posRef.current++;
      }, delay);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, map]);

  return null;
};

export default RoutingMatching;
