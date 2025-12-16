import L from 'leaflet';
import AutoFlyTo from './AutoFly';
import AddIcon from '@mui/icons-material/Add';
import { APIURL } from '../../../../constants';
import DeleteIcon from '@mui/icons-material/Delete';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useMemo } from 'react';
import { FormControlLabel, Radio, Button } from '@mui/material';
import { AddressServices, ApiService } from '../../../../services';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Autocomplete, TextField, FormControl, RadioGroup } from '@mui/material';

const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const shifts = [
  { id: '1b0b7594-c88c-470b-a956-f8f79918fd36', name: 'Day General Shift' },
  { id: '2f7d76b8-87a9-4dc1-822a-a39e99b314e9', name: 'Night General Shift' },
  { id: '3', name: 'First Shift' },
  { id: '4', name: 'Second Shift' },
  { id: '5', name: 'Third Shift' },
];

const FitBounds = ({ stopPoints }) => {
  const map = useMap();

  useEffect(() => {
    const bounds = stopPoints
      .filter((s) => s.latitude && s.longitude)
      .map((s) => [parseFloat(s.latitude), parseFloat(s.longitude)])
      .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng));

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [stopPoints, map]);

  return null;
};

const getVehicleNumber = (rowData = {}) => {
  return (
    rowData.vehicle_number ||
    rowData.busNumber ||
    rowData.vehicle?.vehicle_number ||
    rowData.vehicle?.vehicle_name ||
    rowData.vehicle?.vehicleNumber ||
    ''
  );
};

const getDriverName = (rowData = {}) => {
  const driver = rowData.busDriver || rowData.vehicle?.driver;
  if (typeof driver === 'string') return driver;
  if (driver?.first_name || driver?.last_name) {
    return `${driver.first_name || ''} ${driver.last_name || ''}`.trim();
  }
  return '';
};

const getCreatedAt = (rowData = {}) => {
  const date = rowData.createdAt || rowData.created_at;
  if (!date) return '';
  try {
    return new Date(date).toLocaleString();
  } catch {
    return date;
  }
};

const getRouteName = (rowData = {}) => rowData?.routeName || rowData?.name || '';
const getVehicleId = (rowData = {}) => rowData?.vehicleID || rowData?.vehicle_id || rowData?.vehicle?.id || '';

const toTimeInputValue = (val) => {
  if (!val) return '';
  if (/^\d{2}:\d{2}$/.test(val)) return val;
  if (/^\d{2}:\d{2}:\d{2}/.test(val)) return val.slice(0, 5);
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const VehicleRouteForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const addressTimeoutRefs = useRef({});

  const rowData = useMemo(() => location.state?.rowData || {}, [location.state?.rowData]);

  const companyID = localStorage.getItem('company_id');
  const isViewMode = location.pathname.includes('/view');

  const [vehicles, setVehicles] = useState([]);
  const [routeName, setRouteName] = useState('');
  const [addressSearchResults, setAddressSearchResults] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedShift, setSelectedShift] = useState(shifts[0].id);
  const [latestSelectedCoords, setLatestSelectedCoords] = useState(null);
  const [stopPoints, setStopPoints] = useState([
    { id: Date.now(), address: '', latitude: '', longitude: '', time: '', returnTime: '', distance: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await ApiService.get(`${APIURL.VEHICLE}?company_id=${companyID}&limit=500`);
        if (Array.isArray(res?.data?.vehicles)) setVehicles(res.data.vehicles);
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      }
    };
    fetchVehicles();
  }, [companyID]);

  useEffect(() => {
    if (!rowData?.id) return;

    const fetchStops = async () => {
      try {
        const res = await ApiService.get(`${APIURL.VEHICLE_ROUTE}/${rowData.id}/stops`);
        if (res?.data?.stops?.length) {
          setStopPoints(
            res.data.stops.map((s) => ({
              id: s.id || Date.now() + Math.random(),
              address: s.address || '',
              latitude: s.latitude || '',
              longitude: s.longitude || '',
              time: toTimeInputValue(s.time),
              returnTime: toTimeInputValue(s.return_time),
              distance: s.distance || '',
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch stops:', error);
      }
    };

    fetchStops();
  }, [rowData?.id]);

  useEffect(() => {
    if (!rowData || !vehicles.length) return;

    const vehicleId = getVehicleId(rowData);
    if (vehicleId) {
      const foundVehicle = vehicles.find((v) => v.id === vehicleId);
      if (foundVehicle) {
        setSelectedVehicle({
          value: foundVehicle.id,
          label: foundVehicle.vehicle?.vehicle_number || foundVehicle.vehicle_number || foundVehicle.vehicle_name || '',
        });
      }
    }

    setRouteName(getRouteName(rowData));
    setSelectedShift(rowData.shiftId || rowData.shift_id || rowData.stops?.[0]?.shift_id || shifts[0].id);

    const stopsData = rowData.Vehicle_Route_Stops || rowData.stops;
    if (Array.isArray(stopsData) && stopsData.length > 0) {
      const hasValidStops = stopsData.some((s) => s.address || s.latitude);
      if (hasValidStops) {
        setStopPoints(
          stopsData.map((s) => ({
            id: s.id || Date.now() + Math.random(),
            address: s.address || '',
            latitude: s.latitude || '',
            longitude: s.longitude || '',
            time: toTimeInputValue(s.time),
            returnTime: toTimeInputValue(s.return_time),
            distance: s.distance || '',
          }))
        );
      }
    }
  }, [rowData, vehicles]);

  const handleStopChange = (idx, key, value) => {
    setStopPoints((prevStops) => {
      const newStops = [...prevStops];
      newStops[idx] = { ...newStops[idx], [key]: value };

      if (key === 'latitude' || key === 'longitude') {
        const lat = parseFloat(newStops[idx].latitude);
        const lng = parseFloat(newStops[idx].longitude);
        if (!isNaN(lat) && !isNaN(lng)) setLatestSelectedCoords({ lat, lng });
      }

      return newStops;
    });
  };

  const handleAddressSearch = async (idx, value) => {
    if (addressTimeoutRefs.current[idx]) clearTimeout(addressTimeoutRefs.current[idx]);

    if (!value || value.trim() === '') {
      setAddressSearchResults((prev) => ({ ...prev, [idx]: [] }));
      return;
    }

    addressTimeoutRefs.current[idx] = setTimeout(async () => {
      try {
        const res = await AddressServices.searchAddress(value);
        setAddressSearchResults((prev) => ({ ...prev, [idx]: Array.isArray(res?.data) ? res.data : [] }));
      } catch (error) {
        console.error('Address search failed:', error);
        setAddressSearchResults((prev) => ({ ...prev, [idx]: [] }));
      }
    }, 500);
  };

  const handleAddressSelect = (idx, selectedOption) => {
    if (!selectedOption) {
      handleStopChange(idx, 'address', '');
      return;
    }

    if (typeof selectedOption === 'string') {
      handleStopChange(idx, 'address', selectedOption);
    } else if (selectedOption.otherData) {
      handleStopChange(idx, 'address', selectedOption.label);
      handleStopChange(idx, 'latitude', selectedOption.otherData.lat);
      handleStopChange(idx, 'longitude', selectedOption.otherData.lon);
    } else {
      handleStopChange(idx, 'address', selectedOption.label);
    }
  };

  const validateForm = () => {
    if (!selectedVehicle?.value) {
      alert('Please select a vehicle');
      return false;
    }

    if (!routeName.trim()) {
      alert('Please enter a route name');
      return false;
    }

    if (stopPoints.length === 0) {
      alert('Please add at least one stop');
      return false;
    }

    const invalidStops = stopPoints.filter(
      (s) => !s.latitude || !s.longitude || isNaN(parseFloat(s.latitude)) || isNaN(parseFloat(s.longitude))
    );

    if (invalidStops.length > 0) {
      alert('All stops must have valid latitude and longitude values');
      return false;
    }

    return true;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload = {
      company_id: companyID,
      vehicle_id: selectedVehicle.value,
      name: routeName.trim(),
      status_id: 1,
      shift_id: selectedShift,
      Vehicle_Route_Stops: stopPoints.map((s) => ({
        company_id: companyID,
        shift_id: selectedShift,
        latitude: parseFloat(s.latitude).toString(),
        longitude: parseFloat(s.longitude).toString(),
        address: s.address.trim(),
        time: s.time || '',
        return_time: s.returnTime || '',
        distance: s.distance ? parseFloat(s.distance).toString() : '0',
      })),
    };

    try {
      const id = rowData?.routeID || rowData?.id;
      let res;

      if (id) {
        res = await ApiService.put(`${APIURL.VEHICLE_ROUTE}/${id}?company_id=${companyID}`, payload);
        if (res.success) {
          alert('Route updated successfully!');
          navigate('/management/vehicle-route');
        } else {
          throw new Error(res.message || 'Update failed');
        }
      } else {
        res = await ApiService.post(APIURL.VEHICLE_ROUTE, payload);
        if (res.success) {
          alert('Route created successfully!');
          navigate('/management/vehicle-route');
        } else {
          throw new Error(res.message || 'Creation failed');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert(error.message || 'Something went wrong! Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStop = () => {
    setStopPoints((prev) => [
      ...prev,
      { id: Date.now(), address: '', latitude: '', longitude: '', time: '', returnTime: '', distance: '' },
    ]);
  };

  const removeStop = (idx) => {
    if (stopPoints.length <= 1) {
      alert('At least one stop is required');
      return;
    }
    setStopPoints((prev) => prev.filter((_, i) => i !== idx));
  };

  const vehicleOptions = vehicles.map((v) => ({
    label:
      v.vehicle?.vehicle_number ||
      v.vehicle?.vehicle_name ||
      v.vehicle_number ||
      v.vehicle_name ||
      v.busNumber ||
      'Unknown Vehicle',
    value: v.id,
  }));

  const initialCenter =
    stopPoints.length && stopPoints[0]?.latitude && stopPoints[0]?.longitude
      ? [parseFloat(stopPoints[0].latitude), parseFloat(stopPoints[0].longitude)]
      : [22.71, 75.85];

  return (
    <div className='p-4'>
      <div className='flex justify-between items-center mb-4'>
        <h1 className='text-2xl font-bold text-[#07163d]'>
          {isViewMode ? 'View Vehicle Route' : rowData?.id ? 'Edit Vehicle Route' : 'Create Vehicle Route'}
        </h1>
        {isViewMode && (
          <Button
            variant='contained'
            onClick={() => navigate('/management/vehicle-route/edit', { state: { rowData } })}>
            Edit Route
          </Button>
        )}
      </div>

      <form onSubmit={handleFormSubmit} className='space-y-4'>
        {/* Basic Information Section */}
        <div className='bg-white p-4 border-t-4 border-[#07163d] rounded-lg shadow-sm'>
          <h2 className='text-lg font-semibold mb-4 text-gray-800'>Route Information</h2>

          <div className='grid md:grid-cols-2 gap-4'>
            <div>
              <label className='block mb-2 text-sm font-semibold text-gray-900'>Vehicle *</label>
              {isViewMode ? (
                <TextField size='small' value={getVehicleNumber(rowData)} disabled fullWidth />
              ) : (
                <Autocomplete
                  disablePortal
                  options={vehicleOptions}
                  value={selectedVehicle}
                  isOptionEqualToValue={(o, v) => o.value === v?.value}
                  getOptionLabel={(o) => o?.label || ''}
                  size='small'
                  renderInput={(params) => <TextField {...params} placeholder='Select Vehicle' required />}
                  onChange={(_, v) => setSelectedVehicle(v)}
                />
              )}
            </div>

            <div>
              <label className='block mb-2 text-sm font-semibold text-gray-900'>Route Name *</label>
              {isViewMode ? (
                <TextField size='small' value={getRouteName(rowData)} disabled fullWidth />
              ) : (
                <TextField
                  size='small'
                  placeholder='Enter route name'
                  fullWidth
                  required
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                />
              )}
            </div>
          </div>

          {isViewMode && (
            <div className='grid md:grid-cols-4 gap-4 mt-4 pt-4 border-t'>
              <div>
                <p className='text-xs text-gray-600 mb-1'>Route Name</p>
                <p className='font-medium'>{getRouteName(rowData)}</p>
              </div>
              <div>
                <p className='text-xs text-gray-600 mb-1'>Vehicle Number</p>
                <p className='font-medium'>{getVehicleNumber(rowData)}</p>
              </div>
              <div>
                <p className='text-xs text-gray-600 mb-1'>Driver</p>
                <p className='font-medium'>{getDriverName(rowData) || 'N/A'}</p>
              </div>
              <div>
                <p className='text-xs text-gray-600 mb-1'>Created At</p>
                <p className='font-medium'>{getCreatedAt(rowData) || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stops Section */}
        <div className='bg-white p-4 rounded-lg border-t-4 border-[#07163d] shadow-sm'>
          <h2 className='text-lg font-semibold mb-2 text-gray-800'>Route Stops</h2>

          {/* Shift Selection */}
          <div className='mb-4'>
            {isViewMode ? (
              <TextField
                size='small'
                value={shifts.find((s) => String(s.id) === String(selectedShift))?.name || ''}
                disabled
                fullWidth
              />
            ) : (
              <FormControl component='fieldset'>
                <RadioGroup row value={String(selectedShift)} onChange={(e) => setSelectedShift(e.target.value)}>
                  {shifts.map((s) => (
                    <FormControlLabel
                      key={s.id}
                      value={String(s.id)}
                      control={<Radio />}
                      label={<span className='text-sm font-medium'>{s.name}</span>}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}
          </div>

          {/* Stops List - now all fields in single row */}
          <div className='space-y-4 overflow-x-auto'>
            <div className='hidden md:grid md:grid-cols-7 gap-3 px-2 pb-1 border-b text-xs text-gray-600 font-bold'>
              <div>Address</div>
              <div>Latitude *</div>
              <div>Longitude *</div>
              <div>Pickup Time</div>
              <div>Return Time</div>
              <div>Distance (km)</div>
              <div className='flex justify-end'>&nbsp;</div>
            </div>
            {stopPoints.map((stop, idx) => (
              <div
                key={stop.id}
                className='flex flex-col md:grid md:grid-cols-7 gap-3 bg-gray-50 border rounded-lg p-2 items-center'>
                {/* Address */}
                <div className='w-full'>
                  <label className='md:hidden block mb-1 text-xs font-semibold text-gray-700'>Address</label>
                  {isViewMode ? (
                    <TextField size='small' value={stop.address} disabled fullWidth />
                  ) : (
                    <Autocomplete
                      freeSolo
                      disablePortal
                      options={(addressSearchResults[idx] || []).map((i) => ({
                        label: i.display_name,
                        value: i.place_id,
                        otherData: i,
                      }))}
                      getOptionLabel={(o) => (typeof o === 'string' ? o : o?.label || '')}
                      size='small'
                      value={stop.address}
                      inputValue={stop.address}
                      renderInput={(params) => <TextField {...params} placeholder='Search or enter address' />}
                      onInputChange={(_, value, reason) => {
                        if (reason === 'input') {
                          handleStopChange(idx, 'address', value);
                          handleAddressSearch(idx, value);
                        } else if (reason === 'clear') {
                          handleStopChange(idx, 'address', '');
                        }
                      }}
                      onChange={(_, value) => handleAddressSelect(idx, value)}
                    />
                  )}
                </div>
                {/* Latitude */}
                <div className='w-full'>
                  <label className='md:hidden block mb-1 text-xs font-semibold text-gray-700'>Latitude *</label>
                  <TextField
                    size='small'
                    type='number'
                    placeholder='22.7196'
                    value={stop.latitude}
                    disabled={isViewMode}
                    required
                    fullWidth
                    inputProps={{ step: 'any' }}
                    onChange={(e) => handleStopChange(idx, 'latitude', e.target.value)}
                  />
                </div>
                {/* Longitude */}
                <div className='w-full'>
                  <label className='md:hidden block mb-1 text-xs font-semibold text-gray-700'>Longitude *</label>
                  <TextField
                    size='small'
                    type='number'
                    placeholder='75.8577'
                    value={stop.longitude}
                    disabled={isViewMode}
                    required
                    fullWidth
                    inputProps={{ step: 'any' }}
                    onChange={(e) => handleStopChange(idx, 'longitude', e.target.value)}
                  />
                </div>
                {/* Pickup Time */}
                <div className='w-full'>
                  <label className='md:hidden block mb-1 text-xs font-semibold text-gray-700'>Pickup Time</label>
                  <TextField
                    size='small'
                    type='time'
                    value={stop.time}
                    disabled={isViewMode}
                    fullWidth
                    inputProps={{ step: 60 }}
                    onChange={(e) => handleStopChange(idx, 'time', e.target.value)}
                  />
                </div>
                {/* Return Time */}
                <div className='w-full'>
                  <label className='md:hidden block mb-1 text-xs font-semibold text-gray-700'>Return Time</label>
                  <TextField
                    size='small'
                    type='time'
                    value={stop.returnTime}
                    disabled={isViewMode}
                    fullWidth
                    inputProps={{ step: 60 }}
                    onChange={(e) => handleStopChange(idx, 'returnTime', e.target.value)}
                  />
                </div>
                {/* Distance */}
                <div className='w-full'>
                  <label className='md:hidden block mb-1 text-xs font-semibold text-gray-700'>Distance (km)</label>
                  <TextField
                    size='small'
                    type='number'
                    placeholder='0'
                    value={stop.distance}
                    disabled={isViewMode}
                    fullWidth
                    inputProps={{ step: 'any', min: 0 }}
                    onChange={(e) => handleStopChange(idx, 'distance', e.target.value)}
                  />
                </div>
                {/* Remove Button */}
                <div className='flex items-center justify-end w-full h-full mt-2 md:mt-0'>
                  <div className='flex gap-2 items-center'>
                    <span className='md:hidden font-semibold'>Stop {idx + 1}</span>
                    {!isViewMode && stopPoints.length > 1 && (
                      <Button
                        size='small'
                        color='error'
                        onClick={() => removeStop(idx)}
                        aria-label='delete stop'
                        variant='outlined'
                        startIcon={<DeleteIcon />}
                        style={{ borderRadius: 0 }}>
                        Remove
                      </Button>
                    )}
                    {isViewMode && <span className='hidden md:block text-xs text-gray-500 p-2'>Stop {idx + 1}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!isViewMode && (
            <Button variant='outlined' startIcon={<AddIcon />} onClick={addStop} sx={{ mt: 2 }}>
              Add Stop
            </Button>
          )}
        </div>

        {/* Map Section */}
        <div className='bg-white p-4 rounded-lg border-t-4 border-[#07163d] shadow-sm'>
          <h2 className='text-lg font-semibold mb-4 text-gray-800'>Route Map</h2>
          <div className='h-[350px] w-full rounded-lg overflow-hidden border'>
            <MapContainer center={initialCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
              {stopPoints.map((s, idx) =>
                s.latitude && s.longitude && !isNaN(parseFloat(s.latitude)) && !isNaN(parseFloat(s.longitude)) ? (
                  <Marker key={s.id} position={[parseFloat(s.latitude), parseFloat(s.longitude)]} icon={customIcon}>
                    <Popup>
                      <div>
                        <strong>Stop {idx + 1}</strong>
                        {s.address && <p className='text-sm mt-1'>{s.address}</p>}
                        <p className='text-xs text-gray-600 mt-1'>
                          {parseFloat(s.latitude).toFixed(6)}, {parseFloat(s.longitude).toFixed(6)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              )}
              <FitBounds stopPoints={stopPoints} />
              {latestSelectedCoords && <AutoFlyTo coords={latestSelectedCoords} />}
            </MapContainer>
          </div>

          {/* Submit Button */}
          {!isViewMode && (
            <div className='w-full flex gap-3 mt-4'>
              <div className='w-1/2'>
                <Button
                  type='button'
                  variant='outlined'
                  onClick={() => navigate('/management/vehicle-route')}
                  disabled={isSubmitting}
                  sx={{ py: 2, width: '100%' }}>
                  Cancel
                </Button>
              </div>
              <div className='w-1/2'>
                <Button
                  type='submit'
                  variant='contained'
                  disabled={isSubmitting}
                  sx={{
                    backgroundColor: '#07163d',
                    '&:hover': { backgroundColor: '#0a1f5c' },
                    py: 2,
                    width: '100%',
                  }}>
                  {isSubmitting ? 'Saving...' : rowData?.id ? 'Update Route' : 'Create Route'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default VehicleRouteForm;
