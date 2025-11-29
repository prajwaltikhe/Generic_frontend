import * as Yup from 'yup';
import { Formik } from 'formik';
import ColorPicker from './ColorPicker';
import { APIURL } from '../../../../constants';
import { ApiService } from '../../../../services';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVehicles } from '../../../../redux/vehiclesSlice';
import { Button, TextField, Autocomplete } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const geofenceTypeOptions = [
  { label: 'In Area', value: 'In Area' },
  { label: 'Out Area', value: 'Out Area' },
  { label: 'Area', value: 'Area' },
];

const GeofenceCreateForm = ({ selectedColor, onColorChange, handleClear, cordinates }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state } = useLocation();

  const rowData = useMemo(() => state?.rowData || {}, [state]);
  const [isCordsEmpty, setIsCordsEmpty] = useState(false);

  const vehicleList = useSelector((s) => s.vehicles?.vehicles || []);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  useEffect(() => {
    dispatch(fetchVehicles({ page: 1, limit: 1000 }));
  }, [dispatch]);
  useEffect(() => {
    setVehicleOptions(vehicleList?.map?.((v) => ({ label: v.vehicle_name, value: String(v.id) })) || []);
  }, [vehicleList]);

  let lat = '',
    lon = '';
  if (Array.isArray(rowData.coordinates)) {
    lon = rowData.coordinates?.[0]?.[0] || '';
    lat = rowData.coordinates?.[0]?.[1] || '';
  } else if (Array.isArray(cordinates) && cordinates.length > 0) {
    lat = cordinates[0][0] ?? '';
    lon = cordinates[0][1] ?? '';
  }

  const initialValues = {
    bus: rowData.vehicle_id ? [String(rowData.vehicle_id)] : rowData.vehicleID ? [String(rowData.vehicleID)] : [],
    geofenceType: String(rowData.type || rowData.geofenceType || ''),
    geofenceName: rowData.geofence_name || rowData.geofenceName || '',
    coordinates: rowData.coordinates ?? cordinates ?? [],
    color: rowData.color || selectedColor,
    latitude: rowData.latitude || lat || '',
    longitude: rowData.longitude || lon || '',
    location: rowData.location || '',
  };

  const schema = Yup.object({
    bus: Yup.array().min(1, 'Please select at least one vehicle').required('Vehicle is required'),
    geofenceType: Yup.string().required('Geofence Type is required'),
    geofenceName: Yup.string().required('Geofence Name is required'),
    location: Yup.string().required('Location is required'),
    latitude: Yup.number().typeError('Latitude must be a number').required('Latitude is required'),
    longitude: Yup.number().typeError('Longitude must be a number').required('Longitude is required'),
  });

  async function handleFormSubmit(values, { resetForm }) {
    const coors =
      Array.isArray(cordinates) && cordinates.length
        ? cordinates
        : Array.isArray(values.coordinates)
        ? values.coordinates
        : [];
    if (!coors.length) return setIsCordsEmpty(true);
    setIsCordsEmpty(false);
    const formatted = coors.map(([la, lo]) => `${la},${lo}`);
    const payload = {
      vehicle_ids: values.bus.filter(Boolean),
      type: values.geofenceType,
      geofence_name: values.geofenceName,
      location: values.location,
      longitude: values.longitude,
      latitude: values.latitude,
      coordinates: JSON.stringify(formatted),
      color: values.color,
    };
    const res = rowData.id
      ? await ApiService.put(`${APIURL.GEOFENCE}/${rowData.id}`, payload)
      : await ApiService.post(APIURL.GEOFENCE, payload);
    if (res.success) {
      alert(res.message || 'Success!');
      navigate('/management/geofence');
      resetForm();
      handleClear();
    } else {
      alert(res.message || 'Error');
    }
  }

  return (
    <Formik onSubmit={handleFormSubmit} enableReinitialize initialValues={initialValues} validationSchema={schema}>
      {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue }) => (
        <form onSubmit={handleSubmit}>
          <div className='mb-3'>
            <label className='block mb-2 text-sm font-medium text-gray-900'>Select Vehicle(s)</label>
            <Autocomplete
              multiple
              disablePortal
              options={vehicleOptions}
              isOptionEqualToValue={(o, v) => String(o.value) === String(v.value)}
              getOptionLabel={(o) => o.label}
              size='small'
              className='w-full'
              name='bus'
              id='bus'
              value={vehicleOptions.filter((opt) => values.bus?.includes(String(opt.value)))}
              onChange={(_, nv) => setFieldValue('bus', nv?.map((v) => v.value) || [])}
              onBlur={handleBlur}
              renderInput={(params) => <TextField {...params} label='Select Vehicle(s)' />}
            />
            {errors.bus && touched.bus && (
              <span className='text-red-500'>{typeof errors.bus === 'string' ? errors.bus : errors.bus[0]}</span>
            )}
          </div>
          <div className='mb-3'>
            <label className='block mb-2 text-sm font-medium text-gray-900'>Select Geofence Type</label>
            <Autocomplete
              disablePortal
              options={geofenceTypeOptions}
              isOptionEqualToValue={(o, v) => o.value === v}
              getOptionLabel={(o) => o.label}
              className='w-full'
              size='small'
              name='geofenceType'
              id='geofenceType'
              value={geofenceTypeOptions.find((opt) => opt.value === values.geofenceType) || null}
              onChange={(_, nv) => setFieldValue('geofenceType', nv ? nv.value : '')}
              onBlur={handleBlur}
              renderInput={(params) => <TextField {...params} label='Select Geofence Type' />}
            />
            {errors.geofenceType && touched.geofenceType && <span className='text-red-500'>{errors.geofenceType}</span>}
          </div>
          <div className='mb-3'>
            <label className='block mb-2 text-sm font-medium text-gray-900'>Geofence Name</label>
            <TextField
              placeholder='Geofence Name'
              className='w-full'
              size='small'
              name='geofenceName'
              id='geofenceName'
              value={values.geofenceName}
              onChange={(e) => setFieldValue('geofenceName', e.target.value)}
              onBlur={handleBlur}
            />
            {errors.geofenceName && touched.geofenceName && <span className='text-red-500'>{errors.geofenceName}</span>}
          </div>
          <div className='mb-3'>
            <label className='block mb-2 text-sm font-medium text-gray-900'>Latitude</label>
            <TextField
              placeholder='Latitude'
              className='w-full'
              size='small'
              name='latitude'
              id='latitude'
              value={values.latitude}
              onChange={(e) => setFieldValue('latitude', e.target.value)}
              onBlur={handleBlur}
            />
            {errors.latitude && touched.latitude && <span className='text-red-500'>{errors.latitude}</span>}
          </div>
          <div className='mb-3'>
            <label className='block mb-2 text-sm font-medium text-gray-900'>Longitude</label>
            <TextField
              placeholder='Longitude'
              className='w-full'
              size='small'
              name='longitude'
              id='longitude'
              value={values.longitude}
              onChange={(e) => setFieldValue('longitude', e.target.value)}
              onBlur={handleBlur}
            />
            {errors.longitude && touched.longitude && <span className='text-red-500'>{errors.longitude}</span>}
          </div>
          <div className='mb-3'>
            <label className='block mb-2 text-sm font-medium text-gray-900'>Location</label>
            <TextField
              placeholder='Location'
              className='w-full'
              size='small'
              name='location'
              id='location'
              value={values.location}
              onChange={(e) => setFieldValue('location', e.target.value)}
              onBlur={handleBlur}
            />
            {errors.location && touched.location && <span className='text-red-500'>{errors.location}</span>}
          </div>
          <ColorPicker selectedColor={selectedColor} onColorChange={onColorChange} handleClear={handleClear} />
          {isCordsEmpty && <span className='text-red-500'>Geofence coordinates cannot be empty</span>}
          <div className='flex float-end gap-3'>
            <Link to='/management/geofence'>
              <Button
                type='button'
                className='bg-gray-400 text-white focus:bg-gray-400 focus:text-white hover:bg-gray-600 hover:text-white mt-6'
                onClick={handleClear}>
                Back
              </Button>
            </Link>
            <Button
              type='submit'
              className='bg-custom-blue text-white focus:bg-custom-blue focus:text-white hover:bg-blue-800 hover:text-white mt-6'>
              Save
            </Button>
          </div>
        </form>
      )}
    </Formik>
  );
};

export default GeofenceCreateForm;
