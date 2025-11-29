import { useEffect, useState } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { MapContainer, TileLayer, Polyline, Polygon, Marker } from 'react-leaflet';

const OsmMap = ({ selectedColor, cordinates, MapEvents }) => {
  const [center, setCenter] = useState({ latitude: '12.9716', longitude: '77.5946' });

  useEffect(() => {
    if (cordinates?.length) setCenter({ latitude: cordinates?.[0]?.[0], longitude: cordinates?.[0]?.[1] });
  }, [cordinates]);
  const mapCenter = [parseFloat(center.latitude), parseFloat(center.longitude)];

  return (
    <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        attribution='&copy; OpenStreetMap contributors'
      />
      <MapEvents />
      <FaMapMarkerAlt className='absolute top-2 right-2 text-xl text-cyan-950 cursor-pointer' title='Create Corridor' />
      {cordinates?.length > 2 ? (
        <Polygon positions={cordinates} pathOptions={{ color: selectedColor, weight: 3, fillOpacity: 0.3 }} />
      ) : (
        <Polyline positions={cordinates} pathOptions={{ color: selectedColor, weight: 3 }} />
      )}
      {cordinates?.map((coord, i) => (
        <Marker key={i} position={coord} />
      ))}
    </MapContainer>
  );
};

export default OsmMap;
