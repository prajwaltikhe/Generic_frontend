import * as Yup from 'yup';
import { Formik } from 'formik';
import ColorPicker from './ColorPicker';
import { APIURL } from '../../../../constants';
import { ApiService } from '../../../../services';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVehicles } from '../../../../redux/vehiclesSlice';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, TextField, Autocomplete, Checkbox, Chip } from '@mui/material';

const geofenceTypeOptions = [
  { label: 'In Area', value: 'In Area' },
  { label: 'Out Area', value: 'Out Area' },
  { label: 'Area', value: 'Area' },
];
const selectAllOpt = { label: 'Select All', value: 'SELECT_ALL' };

const GeofenceCreateForm = ({ selectedColor, onColorChange, handleClear, cordinates }) => {
  const dispatch = useDispatch(),
    navigate = useNavigate(),
    { state } = useLocation();
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
  } else if (Array.isArray(cordinates) && cordinates.length) {
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
    bus: Yup.array()
      .of(Yup.string())
      .min(1, 'Please select at least one vehicle')
      .required('Vehicle selection is required'),
    geofenceType: Yup.string().required('Geofence Type is required'),
    geofenceName: Yup.string().required('Geofence Name is required'),
    location: Yup.string().required('Location is required'),
    latitude: Yup.number().typeError('Latitude must be a number').required('Latitude is required'),
    longitude: Yup.number().typeError('Longitude must be a number').required('Longitude is required'),
  });

  async function handleFormSubmit(v, { resetForm }) {
    let selectedBus = [];
    if (Array.isArray(v.bus))
      selectedBus =
        v.bus.includes('SELECT_ALL') || v.bus.length === vehicleOptions.length
          ? vehicleOptions.map((o) => o.value)
          : v.bus.filter((id) => id !== 'SELECT_ALL' && id);
    const coors =
      Array.isArray(cordinates) && cordinates.length ? cordinates : Array.isArray(v.coordinates) ? v.coordinates : [];
    if (!coors.length) return setIsCordsEmpty(true);
    setIsCordsEmpty(false);
    const payload = {
      vehicle_ids: selectedBus,
      type: v.geofenceType,
      geofence_name: v.geofenceName,
      location: v.location,
      longitude: v.longitude,
      latitude: v.latitude,
      coordinates: JSON.stringify(coors.map(([la, lo]) => `${la},${lo}`)),
      color: v.color,
    };
    const res = rowData.id
      ? await ApiService.put(`${APIURL.GEOFENCE}/${rowData.id}`, payload)
      : await ApiService.post(APIURL.GEOFENCE, payload);
    alert(res.message || (res.success ? 'Success!' : 'Error'));
    if (res.success) {
      navigate('/management/geofence');
      resetForm();
      handleClear();
    }
  }

  const getVehicleDisplay = (selected, all) =>
    !Array.isArray(selected) || !selected.length
      ? []
      : selected.length === all.length || selected.includes('SELECT_ALL')
      ? [selectAllOpt]
      : all.filter((o) => selected.includes(o.value));
  const getVehicleOptions = (arr) => (arr && arr.length ? [selectAllOpt, ...arr] : []);
  const handleVehicleChange = (all, setFieldValue, values) => (_, nv) => {
    const isAll = nv.some((o) => o.value === 'SELECT_ALL');
    setFieldValue(
      'bus',
      isAll
        ? (values.bus?.length || 0) === all.length || values.bus?.includes('SELECT_ALL')
          ? []
          : all.map((o) => o.value)
        : nv.filter((o) => o.value !== 'SELECT_ALL').map((o) => o.value)
    );
  };

  return (
    <Formik onSubmit={handleFormSubmit} enableReinitialize initialValues={initialValues} validationSchema={schema}>
      {({ values, errors, touched, handleBlur, handleSubmit, setFieldValue }) => (
        <form onSubmit={handleSubmit}>
          <FieldBlock label='Select Vehicle(s) *' error={errors.bus} touched={touched.bus}>
            <Autocomplete
              multiple
              disablePortal
              options={getVehicleOptions(vehicleOptions)}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              getOptionLabel={(o) => o.label}
              size='small'
              className='w-full'
              name='bus'
              id='bus'
              value={getVehicleDisplay(values.bus, vehicleOptions)}
              onChange={handleVehicleChange(vehicleOptions, setFieldValue, values)}
              onBlur={() => setFieldValue('bus', values.bus)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Select Vehicle(s)'
                  error={Boolean(errors.bus && touched.bus)}
                  helperText={
                    errors.bus && touched.bus ? (typeof errors.bus === 'string' ? errors.bus : errors.bus[0]) : ''
                  }
                />
              )}
              renderOption={(props, opt) => (
                <li {...props} key={opt.value}>
                  <Checkbox
                    sx={{ mr: 1 }}
                    checked={
                      opt.value === 'SELECT_ALL'
                        ? Array.isArray(values.bus) &&
                          (values.bus.length === vehicleOptions.length || values.bus.includes('SELECT_ALL'))
                        : Array.isArray(values.bus) && values.bus.includes(opt.value)
                    }
                  />
                  {opt.label}
                </li>
              )}
              renderTags={(val, getTagProps) =>
                val.length > 3
                  ? [
                      ...val
                        .slice(0, 2)
                        .map((o, i) => <Chip key={o.value} label={o.label} {...getTagProps({ index: i })} />),
                      <Chip key='more' label={`+${val.length - 2} more`} {...getTagProps({ index: 2 })} />,
                    ]
                  : val.map((o, i) => <Chip key={o.value} label={o.label} {...getTagProps({ index: i })} />)
              }
            />
          </FieldBlock>
          <FieldBlock label='Select Geofence Type *' error={errors.geofenceType} touched={touched.geofenceType}>
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
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Select Geofence Type'
                  required
                  error={Boolean(errors.geofenceType && touched.geofenceType)}
                  helperText={errors.geofenceType && touched.geofenceType ? errors.geofenceType : ''}
                />
              )}
            />
          </FieldBlock>
          <FieldBlock label='Geofence Name *' error={errors.geofenceName} touched={touched.geofenceName}>
            <TextField
              placeholder='Geofence Name'
              className='w-full'
              size='small'
              name='geofenceName'
              id='geofenceName'
              value={values.geofenceName}
              onChange={(e) => setFieldValue('geofenceName', e.target.value)}
              onBlur={handleBlur}
              required
              error={Boolean(errors.geofenceName && touched.geofenceName)}
              helperText={errors.geofenceName && touched.geofenceName ? errors.geofenceName : ''}
            />
          </FieldBlock>
          <FieldBlock label='Latitude *' error={errors.latitude} touched={touched.latitude}>
            <TextField
              placeholder='Latitude'
              className='w-full'
              size='small'
              name='latitude'
              id='latitude'
              value={values.latitude}
              onChange={(e) => setFieldValue('latitude', e.target.value)}
              onBlur={handleBlur}
              required
              error={Boolean(errors.latitude && touched.latitude)}
              helperText={errors.latitude && touched.latitude ? errors.latitude : ''}
            />
          </FieldBlock>
          <FieldBlock label='Longitude *' error={errors.longitude} touched={touched.longitude}>
            <TextField
              placeholder='Longitude'
              className='w-full'
              size='small'
              name='longitude'
              id='longitude'
              value={values.longitude}
              onChange={(e) => setFieldValue('longitude', e.target.value)}
              onBlur={handleBlur}
              required
              error={Boolean(errors.longitude && touched.longitude)}
              helperText={errors.longitude && touched.longitude ? errors.longitude : ''}
            />
          </FieldBlock>
          <FieldBlock label='Location *' error={errors.location} touched={touched.location}>
            <TextField
              placeholder='Location'
              className='w-full'
              size='small'
              name='location'
              id='location'
              value={values.location}
              onChange={(e) => setFieldValue('location', e.target.value)}
              onBlur={handleBlur}
              required
              error={Boolean(errors.location && touched.location)}
              helperText={errors.location && touched.location ? errors.location : ''}
            />
          </FieldBlock>
          <ColorPicker selectedColor={selectedColor} onColorChange={onColorChange} handleClear={handleClear} />
          {isCordsEmpty && <span className='text-red-500'>Geofence coordinates cannot be empty</span>}
          <div className='flex float-end gap-3 mt-6'>
            <Link to='/management/geofence'>
              <Button type='button' className='bg-gray-400 text-white hover:bg-gray-600' onClick={handleClear}>
                Back
              </Button>
            </Link>
            <Button type='submit' className='bg-custom-blue text-white hover:bg-blue-800'>
              Save
            </Button>
          </div>
        </form>
      )}
    </Formik>
  );
};

// helper to minimize error rendering/label
function FieldBlock({ label, error, touched, children }) {
  return (
    <div className='mb-3'>
      <label className='block mb-2 text-sm font-medium text-gray-900'>{label}</label>
      {children}
      {error && touched && <span className='text-red-500'>{typeof error === 'string' ? error : error[0]}</span>}
    </div>
  );
}

export default GeofenceCreateForm;
