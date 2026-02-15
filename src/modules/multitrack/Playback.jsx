import moment from 'moment';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import RoutingMatching from './RoutingMatching';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlaybackData } from '../../redux/multiTrackSlice';
import { IconButton, Paper, Slider, Button, TextField, Chip, Stack } from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon, PlayArrow as PlayIcon, Pause as PauseIcon } from '@mui/icons-material';

export default function Playback() {
  const [showControls, setShowControls] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [shortcut, setShortcut] = useState('');
  const [routeCoordinate, setRouteCoordinate] = useState([]);
  const [speed, setSpeed] = useState(10);
  const [isPlay, setIsPlay] = useState(false);

  const dispatch = useDispatch();
  const { state } = useLocation();
  const selectedVehicle = state?.selectedVehicle;

  const { playbackData, loadingPlayback } = useSelector((s) => s.multiTrackStatus);

  useEffect(() => {
    if (playbackData.length) setRouteCoordinate(playbackData.map((i) => [i.latitude, i.longitude]));
  }, [playbackData]);
  const setShortcutDates = (type) => {
    const format = 'YYYY-MM-DDTHH:mm';
    if (type === 'last1hour') {
      setFromDate(moment().subtract(1, 'hours').format(format));
      setToDate(moment().format(format));
    } else if (type === 'today') {
      setFromDate(moment().startOf('day').format(format));
      setToDate(moment().endOf('day').format(format));
    }
  };

  const handleShortcutChip = (type) => {
    setShortcut(type);
    setShortcutDates(type);
  };

  const handlePlay = async () => {
    if (isPlay) return setIsPlay(false);
    if (!fromDate || !toDate) return alert('Select From/To dates');
    const params = {
      from: moment(fromDate).toISOString(),
      to: moment(toDate).toISOString(),
      imei: selectedVehicle.imei_number,
    };
    dispatch(fetchPlaybackData(params)).then((res) => {
      if (fetchPlaybackData.fulfilled.match(res)) {
        setIsPlay(true);
      } else {
        alert(res.payload || 'No data found');
      }
    });
  };

  const filteredCoordinate = routeCoordinate.filter(
    (c, i, arr) => i === 0 || c[0] !== arr[i - 1][0] || c[1] !== arr[i - 1][1],
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
          <RoutingMatching
            coordinates={filteredCoordinate}
            speed={speed}
            isPlaying={isPlay}
            vehicle_number={selectedVehicle?.vehicle_number}
          />
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
            <Stack direction='row' spacing={1} className='mb-1 w-full'>
              <Chip
                label='Last 1 Hr'
                color={shortcut === 'last1hour' ? 'primary' : 'default'}
                clickable
                onClick={() => handleShortcutChip('last1hour')}
                variant={shortcut === 'last1hour' ? 'filled' : 'outlined'}
                size='small'
                className='flex-1'
                style={{ width: '100%' }}
              />
              <Chip
                label='Today'
                color={shortcut === 'today' ? 'primary' : 'default'}
                clickable
                onClick={() => handleShortcutChip('today')}
                variant={shortcut === 'today' ? 'filled' : 'outlined'}
                size='small'
                className='flex-1'
                style={{ width: '100%' }}
              />
            </Stack>
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
              disabled={loadingPlayback}
              startIcon={isPlay ? <PauseIcon /> : <PlayIcon />}
              onClick={handlePlay}>
              {loadingPlayback ? 'Loading...' : isPlay ? 'Pause' : 'Play'}
            </Button>
          </div>
        </Paper>
      )}
    </div>
  );
}
