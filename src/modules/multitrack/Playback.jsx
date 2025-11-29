import { useState } from 'react';
import { APIURL } from '../../constants';
import { useLocation } from 'react-router-dom';
import RoutingMatching from './RoutingMatching';
import { MapContainer, TileLayer } from 'react-leaflet';
import lastVehicleData from '../../services/lastVehicleData';
import { IconButton, Paper, Slider, Button, TextField, MenuItem } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon, PlayArrow as PlayIcon, Pause as PauseIcon } from '@mui/icons-material';

export default function Playback() {
  const [showControls, setShowControls] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [shortcut, setShortcut] = useState('');
  const [routeCoordinate, setRouteCoordinate] = useState([]);
  const [speed, setSpeed] = useState(10);
  const [isPlay, setIsPlay] = useState(false);

  const { state } = useLocation();
  const selectedVehicle = state?.selectedVehicle;

  const setShortcutDates = (type) => {
    const d = new Date();
    if (type === 'yesterday') d.setDate(d.getDate() - 1);
    const dateStr = d.toISOString().slice(0, 10);
    setFromDate(`${dateStr}T00:00`);
    setToDate(`${dateStr}T23:59`);
  };

  const handleShortcutChange = (e) => {
    setShortcut(e.target.value);
    if (e.target.value === 'today' || e.target.value === 'yesterday') setShortcutDates(e.target.value);
  };

  const handlePlay = async () => {
    if (isPlay) return setIsPlay(false);
    if (!fromDate || !toDate) return alert('Select From/To dates');
    try {
      const res = await lastVehicleData.post(
        APIURL.PLAYBACK,
        {},
        {
          from: new Date(fromDate).toISOString(),
          to: new Date(toDate).toISOString(),
          imei: selectedVehicle.imei_number,
        }
      );
      if (res.success && res.data.length) {
        setRouteCoordinate(res.data.map((i) => [i.latitude, i.longitude]));
        setIsPlay(true);
      } else alert('No data found');
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCoordinate = routeCoordinate.filter(
    (c, i, arr) => i === 0 || c[0] !== arr[i - 1][0] || c[1] !== arr[i - 1][1]
  );

  return (
    <div className='relative w-full h-screen bg-gray-200'>
      <MapContainer
        center={routeCoordinate[0] || [12.6749816, 79.2863616]}
        zoom={13}
        scrollWheelZoom
        className='w-full h-full z-0'>
        <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' attribution='&copy; OpenStreetMap' />
        {routeCoordinate.length > 0 && (
          <RoutingMatching coordinates={filteredCoordinate} speed={speed} isPlaying={isPlay} />
        )}
      </MapContainer>
      <div className='absolute top-4 right-4 z-10'>
        <IconButton className='bg-white shadow-md rounded-full' onClick={() => setShowControls((v) => !v)}>
          {showControls ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </div>
      {showControls && (
        <Paper className='absolute top-16 right-4 p-4 shadow-lg w-64 bg-white'>
          <h2 className='text-md text-center font-semibold'>{selectedVehicle?.vehicle_name}</h2>
          <div className='my-2'>
            <label className='text-sm'>From</label>
            <TextField
              type='datetime-local'
              fullWidth
              size='small'
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className='my-2'>
            <label className='text-sm'>To</label>
            <TextField
              type='datetime-local'
              size='small'
              fullWidth
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className='my-2'>
            <label className='text-sm'>Shortcut</label>
            <TextField select fullWidth size='small' value={shortcut} onChange={handleShortcutChange}>
              <MenuItem value='today'>Today</MenuItem>
              <MenuItem value='yesterday'>Yesterday</MenuItem>
            </TextField>
          </div>
          <div className='my-2'>
            <label className='text-sm'>Speed Control</label>
            <Slider value={speed} onChange={(_, v) => setSpeed(v)} min={0} max={100} className='w-full' />
          </div>
          <div className='flex justify-between'>
            <Button variant='contained' color='success'>
              Speed
            </Button>
            <Button variant='contained' color='error'>
              Detail
            </Button>
          </div>
          <div className='mt-4 text-center'>
            <Button
              variant='contained'
              color='primary'
              startIcon={isPlay ? <PauseIcon /> : <PlayIcon />}
              onClick={handlePlay}>
              {isPlay ? 'Pause' : 'Play'}
            </Button>
          </div>
        </Paper>
      )}
    </div>
  );
}
