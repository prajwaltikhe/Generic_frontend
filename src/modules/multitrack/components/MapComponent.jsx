import L from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useSelector, shallowEqual } from 'react-redux';
import { useRef, useMemo, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ScaleControl, ZoomControl, Circle } from 'react-leaflet';

const statusColors = {
  Running: { cls: 'bg-green-100 text-green-700 fill-white', color: '#22c55e' },
  Idle: { cls: 'bg-yellow-100 text-yellow-700 fill-white', color: '#facc15' },
  Parked: { cls: 'bg-red-100 text-red-700 fill-white', color: '#ef4444' },
  Offline: { cls: 'bg-blue-100 text-blue-700 fill-white', color: '#2563eb' },
  New: { cls: 'bg-gray-100 text-gray-700 fill-white', color: '#6b7280' },
  Unknown: { cls: 'bg-gray-100 text-gray-700 fill-white', color: '#6b7280' },
};

const getIcon = (status) =>
  new L.DivIcon({
    html: ReactDOMServer.renderToStaticMarkup(
      <FaMapMarkerAlt color={statusColors[status?.trim?.()]?.color || statusColors.Unknown.color} size={30} />
    ),
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

const getCls = (status) => statusColors[status?.trim?.()]?.cls || statusColors.Unknown.cls;

const selectDevices = (s) => [
  ...(s.multiTrackStatus.runningDevices || []),
  ...(s.multiTrackStatus.idelDevices || []),
  ...(s.multiTrackStatus.parkedDevices || []),
  ...(s.multiTrackStatus.offlineVehicleData || []),
  ...(s.multiTrackStatus.newDevices || []),
];

function MapEffects({ selectedVehicle, markerRefs }) {
  const map = useMap();
  useEffect(() => {
    if (selectedVehicle?.id && markerRefs.current[selectedVehicle.id]) {
      markerRefs.current[selectedVehicle.id].openPopup();
      map.flyTo([selectedVehicle.lat, selectedVehicle.lng], 16, { animate: true, duration: 1.2 });
    }
  }, [selectedVehicle, markerRefs, map]);
  return null;
}

const DEFAULT_CENTER = [20.5937, 78.9629];

function InlineRouteLabel({ lat, lng, content }) {
  const map = useMap(),
    [pos, setPos] = useState({ left: 0, top: 0 });
  useEffect(() => {
    if (!map || isNaN(lat) || isNaN(lng)) return;
    const update = () => {
      const { x, y } = map.latLngToContainerPoint([lat, lng]);
      setPos({ left: x, top: y + 4 });
    };
    update();
    map.on('move zoom', update);
    return () => map.off('move zoom', update);
  }, [map, lat, lng]);
  return (
    <div
      style={{
        pointerEvents: 'none',
        position: 'absolute',
        left: pos.left,
        top: pos.top,
        zIndex: 402,
        transform: 'translateX(-50%)',
      }}
      className='leaflet-zoom-hide min-w-18 text-center absolute text-xs text-blue-700 font-medium bg-white/90 rounded px-2 py-0.5 shadow border border-blue-200'>
      {content}
    </div>
  );
}

const MapComponent = ({ selectedVehicle }) => {
  const markerRefs = useRef({});
  const allDevices = useSelector(selectDevices, shallowEqual);

  const devices = useMemo(() => {
    const standardize = (d) => ({
      id: d.id,
      name: d.vehicle_name ?? d.name ?? '-',
      lat: d.lat,
      lng: d.lng,
      icon: getIcon(d.status),
      timestamp: d.timestamp || '',
      address: d.address || '',
      speed: d.speed,
      cls: getCls(d.status),
      label: d.status ?? 'Unknown',
      route_name: d.route_name ?? '',
    });
    if (selectedVehicle) return [standardize(selectedVehicle)];
    return (allDevices || [])
      .filter((d) => d && typeof d.lat === 'number' && typeof d.lng === 'number')
      .map(standardize);
  }, [selectedVehicle, allDevices]);

  const mapCenter = useMemo(() => {
    if (selectedVehicle?.lat && selectedVehicle?.lng) return [selectedVehicle.lat, selectedVehicle.lng];
    if (devices.length === 1) return [devices[0].lat, devices[0].lng];
    if (devices.length > 1) {
      const [latSum, lngSum] = devices.reduce(([la, ln], d) => [la + d.lat, ln + d.lng], [0, 0]);
      return [latSum / devices.length, lngSum / devices.length];
    }
    return DEFAULT_CENTER;
  }, [selectedVehicle, devices]);

  return (
    <div className='h-screen w-full relative'>
      <MapContainer
        center={mapCenter}
        zoom={5}
        minZoom={1}
        maxZoom={18}
        className='w-full h-full'
        zoomControl={false}
        scrollWheelZoom
        style={{ background: '#e5e7eb', position: 'relative', zIndex: 0 }}>
        <ZoomControl position='bottomright' />
        <ScaleControl position='bottomleft' />
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {devices.some((d) => d.route_name) && (
          <div className='pointer-events-none absolute inset-0 z-[400]'>
            {devices.map((d, i) => (
              <InlineRouteLabel
                key={`route-label-${d.id ?? 'noid'}_${i}`}
                lat={d.lat}
                lng={d.lng}
                content={d.route_name || <span className='italic text-gray-400'>No route</span>}
              />
            ))}
          </div>
        )}
        {devices.map((d, i) => (
          <Marker
            key={`${d.id ?? 'noid'}_${i}`}
            position={[d.lat, d.lng]}
            icon={d.icon}
            ref={(ref) => ref && (markerRefs.current[d.id] = ref)}>
            <Popup>
              <div className='min-w-[180px] z-[400]'>
                <div className='font-bold text-base mb-1'>{d.name}</div>
                <div className='text-xs text-gray-600 mb-1'>
                  <span className='font-semibold'>Time:</span>{' '}
                  {d.timestamp ? new Date(d.timestamp).toLocaleString() : 'N/A'}
                </div>
                <div className='text-xs text-gray-600 mb-1'>
                  <span className='font-semibold'>Speed:</span> {d.speed ?? '-'} km/h
                </div>
                <div className='text-xs text-gray-600 mb-1'>
                  <span className='font-semibold'>Address:</span> {d.address}
                </div>
                <div className='mt-2'>
                  <span className={`inline-block px-2 py-1 rounded text-xs ${d.cls}`}>{d.label}</span>
                </div>
              </div>
            </Popup>
            {selectedVehicle && d.id === selectedVehicle.id && (
              <Circle
                center={[d.lat, d.lng]}
                radius={300}
                pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.15 }}
              />
            )}
          </Marker>
        ))}
        <MapEffects selectedVehicle={selectedVehicle} markerRefs={markerRefs} />
      </MapContainer>
    </div>
  );
};

export default MapComponent;