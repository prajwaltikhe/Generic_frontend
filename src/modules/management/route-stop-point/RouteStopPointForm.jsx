import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Autocomplete, Button, FormControl, FormLabel, TextField as Input, Select } from '@mui/material';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const RouteStopPointForm = () => {
  const [stopPoints, setStopPoints] = useState([
    {
      id: Date.now(),
      address: '',
      latitude: '',
      longitude: '',
      time: '',
      returnTime: '',
      distance: '',
    },
  ]);

  const addStopPoint = () => {
    setStopPoints([
      ...stopPoints,
      {
        id: Date.now(),
        address: '',
        latitude: '',
        longitude: '',
        time: '',
        returnTime: '',
        distance: '',
      },
    ]);
  };

  const removeStopPoint = (id) => {
    setStopPoints(stopPoints.filter((point) => point.id !== id));
  };

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Vehicle Stop Points</h1>
      </div>
      <div className='bg-white p-3 rounded-sm border-t-3 border-[#07163d]'>
        <div className='p-3'>
          <h2 className='text-sm font-semibold mb-2'>
            Select Shift <span className='text-red-500'>*</span>
          </h2>
          <Autocomplete
            disablePortal
            id='combo-box-demo'
            options={['Day', 'Night']}
            renderInput={(params) => <Input {...params} />}
            size='small'
          />
          {stopPoints.map((stop, index) => (
            <div key={stop.id} className='grid grid-cols-8 gap-2 items-center my-2 mb-3 mt-4'>
              <FormControl className='col-span-2'>
                <FormLabel className='text-sm font-semibold'>
                  Vehicle Stop Point Address <span className='text-red-500'>*</span>
                </FormLabel>
                <Input
                  placeholder='Vehicle Stop Point Address'
                  value={stop.address}
                  size='small'
                  onChange={(e) => {
                    const newStopPoints = [...stopPoints];
                    newStopPoints[index].address = e.target.value;
                    setStopPoints(newStopPoints);
                  }}
                />
              </FormControl>
              <FormControl>
                <FormLabel className='text-sm font-semibold'>
                  Latitude <span className='text-red-500'>*</span>
                </FormLabel>
                <Input
                  placeholder='Latitude'
                  size='small'
                  onChange={(e) => {
                    const newStopPoints = [...stopPoints];
                    newStopPoints[index].latitude = e.target.value;
                    setStopPoints(newStopPoints);
                  }}
                  value={stop.latitude}
                />
              </FormControl>
              <FormControl>
                <FormLabel className='text-sm font-semibold'>
                  Longitude <span className='text-red-500'>*</span>
                </FormLabel>
                <Input
                  placeholder='Longitude'
                  size='small'
                  onChange={(e) => {
                    const newStopPoints = [...stopPoints];
                    newStopPoints[index].longitude = e.target.value;
                    setStopPoints(newStopPoints);
                  }}
                  value={stop.longitude}
                />
              </FormControl>
              <FormControl>
                <FormLabel className='text-sm font-semibold'>
                  Time <span className='text-red-500'>*</span>
                </FormLabel>
                <Input
                  type='time'
                  onAbort={(e) => {
                    const newStopPoints = [...stopPoints];
                    newStopPoints[index].time = e.target.value;
                    setStopPoints(newStopPoints);
                  }}
                  size='small'
                  value={stop.time}
                />
              </FormControl>
              <FormControl>
                <FormLabel className='text-sm font-semibold'>
                  Return Time <span className='text-red-500'>*</span>
                </FormLabel>
                <Input
                  type='time'
                  size='small'
                  onAbort={(e) => {
                    const newStopPoints = [...stopPoints];
                    newStopPoints[index].returnTime = e.target.value;
                    setStopPoints(newStopPoints);
                  }}
                  value={stop.returnTime}
                />
              </FormControl>
              <FormControl>
                <FormLabel className='text-sm font-semibold'>
                  Distance (KM) <span className='text-red-500'>*</span>
                </FormLabel>
                <Input
                  type='number'
                  size='small'
                  onAbort={(e) => {
                    const newStopPoints = [...stopPoints];
                    newStopPoints[index].distance = e.target.value;
                    setStopPoints(newStopPoints);
                  }}
                  value={stop.distance}
                />
              </FormControl>
              <button
                className='text-white bg-[gray] hover:bg-[#ff0000be] focus:outline-none font-medium rounded-sm text-sm py-2 text-center me-2 mt-5 cursor-pointer'
                onClick={() => removeStopPoint(stop.id)}>
                Remove
              </button>
            </div>
          ))}

          <div className='flex justify-end'>
            <button
              className='mt-4 bg-[#07163d] text-white px-3 text-sm py-2 rounded-sm cursor-pointer'
              type='button'
              onClick={addStopPoint}>
              Click here to add bus stops
            </button>
          </div>

          <div className='mt-6 h-96 w-full'>
            <MapContainer center={[20.5937, 78.9629]} zoom={5} className='w-full h-full'>
              <TileLayer
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                attribution='&copy; OpenStreetMap contributors'
              />
              {stopPoints.map((stop) =>
                stop.latitude && stop.longitude ? (
                  <Marker
                    key={stop.id}
                    position={[parseFloat(stop.latitude), parseFloat(stop.longitude)]}
                    icon={customIcon}>
                    <Popup>
                      <div>
                        <strong>{stop.address}</strong>
                        <br />
                        <small>
                          {stop.time} - {stop.returnTime}
                        </small>
                        <br />
                        <em>{stop.distance} KM</em>
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteStopPointForm;
