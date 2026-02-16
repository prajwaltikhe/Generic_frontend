import OsmMap from './components/OsmMap';
import { useEffect, useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import GeofenceCreateForm from './components/GeofenceCreateForm';

const colorMap = {
  blue: '#2196F3',
  red: '#F44336',
  green: '#4CAF50',
  yellow: '#FFEB3B',
  orange: '#FF9800',
  purple: '#9C27B0',
};
const mapColorToHex = (color) => (!color ? '#2196F3' : color.startsWith('#') ? color : colorMap[color] || '#2196F3');

export default function GeofenceCreate() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const row = state?.rowData;
  const getCoords = () => (Array.isArray(row?.coordinates) ? row.coordinates.map((c) => c.map(Number)) : []);
  const [coordinates, setCoordinates] = useState(getCoords);
  const [selectedColor, setSelectedColor] = useState(mapColorToHex(row?.color));
  const MapEvents = () => {
    useMapEvents({
      click: ({ latlng }) => setCoordinates((prev) => [...prev, [latlng.lat, latlng.lng]]),
    });
    return null;
  };
  useEffect(() => {
    setCoordinates(getCoords());
    setSelectedColor(mapColorToHex(row?.color));
    // eslint-disable-next-line
  }, [state]);
  return (
    <div className='w-full h-full p-2'>
      <div className='flex items-center gap-4 mb-4'>
        <button
          type='button'
          onClick={() => navigate(-1)}
          className='group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all duration-200 ease-in-out text-gray-700 font-medium text-sm active:scale-95 cursor-pointer'>
          <IoArrowBack className='w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1' />
          Back
        </button>
        <h1 className='text-2xl font-bold text-[#07163d]'>Vehicle Geofence</h1>
      </div>
      <div className='bg-white rounded-sm border-t-3 border-[#07163d] p-5'>
        <div className='flex flex-col-reverse md:grid md:grid-cols-3 gap-3'>
          <div className='md:col-span-1'>
            <GeofenceCreateForm
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
              handleClear={() => setCoordinates([])}
              cordinates={coordinates}
              rowData={row}
            />
          </div>
          <div className='md:col-span-2 bg-gray-100 p-5 rounded overflow-hidden'>
            <OsmMap selectedColor={selectedColor} MapEvents={MapEvents} cordinates={coordinates} />
          </div>
        </div>
      </div>
    </div>
  );
}
