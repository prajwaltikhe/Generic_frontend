import { useEffect } from 'react';
import { useFormik } from 'formik';
import { APIURL } from '../../../../constants';
import { ApiService } from '../../../../services';
import { useSelector, useDispatch } from 'react-redux';
import { Autocomplete, TextField } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchVehicleRoutes } from '../../../../redux/vehicleRouteSlice';

const FIELDS = [
  { name: 'dayGenStartTime', label: 'Day General Start time' },
  { name: 'dayGenEndTime', label: 'Day General End Time' },
  { name: 'nightGenStartTime', label: 'Night General Start time' },
  { name: 'nightGenEndTime', label: 'Night General End Time' },
  { name: 'firstShiftStartTime', label: 'First Shift Start time' },
  { name: 'firstShiftEndTime', label: 'First Shift End Time' },
  { name: 'secondShiftStartTime', label: 'Second Shift Start time' },
  { name: 'secondShiftEndTime', label: 'Second Shift End Time' },
  { name: 'thirdShiftStartTime', label: 'Third Shift Start time' },
  { name: 'thirdShiftEndTime', label: 'Third Shift End Time' },
];

const initialForm = Object.fromEntries([['vehicle', ''], ['route', ''], ...FIELDS.map((f) => [f.name, ''])]);

function PlantInTimeForm() {
  const { state: rowData } = useLocation();
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const mode = pathname.includes('/view') ? 'view' : pathname.includes('/edit') ? 'edit' : 'create';
  const isView = mode === 'view';
  const companyId = localStorage.getItem('company_id');
  const dispatch = useDispatch();

  const { routes } = useSelector((s) => s?.vehicleRoute?.vehicleRoutes || []);

  const vehicleOptions = routes?.map((v) => ({ label: v?.vehicle?.vehicle_number, value: v.vehicle_id })) || [];
  const routeOptions = routes?.map((r) => ({ label: r.name, value: r.id })) || [];

  const getOption = (opts, value) => opts.find((opt) => opt.value === value) || null;

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: rowData
      ? {
          vehicle: rowData.vehicle_id || '',
          route: rowData.route_id || '',
          dayGenStartTime: rowData.dayGeneral || '',
          dayGenEndTime: rowData.dayGeneralEnd || '',
          nightGenStartTime: rowData.nightGeneral || '',
          nightGenEndTime: rowData.nightGeneralEnd || '',
          firstShiftStartTime: rowData.firstGeneral || '',
          firstShiftEndTime: rowData.firstGeneralEnd || '',
          secondShiftStartTime: rowData.secondGeneral || '',
          secondShiftEndTime: rowData.secondGeneralEnd || '',
          thirdShiftStartTime: rowData.thirdGeneral || '',
          thirdShiftEndTime: rowData.thirdGeneralEnd || '',
        }
      : initialForm,
    onSubmit: async (values) => {
      const payload = {
        vehicle_id: values.vehicle,
        company_id: companyId,
        vehicle_route_id: values.route,
        day_general_start_time: values.dayGenStartTime,
        day_general_end_time: values.dayGenEndTime,
        night_general_start_time: values.nightGenStartTime,
        night_general_end_time: values.nightGenEndTime,
        first_shift_start_time: values.firstShiftStartTime,
        first_shift_end_time: values.firstShiftEndTime,
        second_shift_start_time: values.secondShiftStartTime,
        second_shift_end_time: values.secondShiftEndTime,
        third_shift_start_time: values.thirdShiftStartTime,
        third_shift_end_time: values.thirdShiftEndTime,
      };
      try {
        const res =
          mode === 'edit' && rowData
            ? await ApiService.put(`${APIURL.PLANTINTIME}/${rowData.plantId}`, payload)
            : await ApiService.post(APIURL.PLANTINTIME, payload);
        if (res.success) navigate('/master/plant-in-time');
        else alert(res.message || 'Something went wrong.');
      } catch {
        alert('Something went wrong.');
      }
    },
  });

  useEffect(() => {
    if (companyId) dispatch(fetchVehicleRoutes({ company_id: companyId, limit: 100 }));
    // eslint-disable-next-line
  }, [dispatch, companyId]);

  return (
    <div className='bg-white rounded-sm border-t-3 border-b-3 border-[#07163d]'>
      <h1 className='text-2xl font-bold p-3 text-[#07163d]'>
        {mode === 'view' ? 'View' : mode === 'edit' ? 'Edit' : 'Create'} Plant In-Time
      </h1>
      <p className='mx-3 mb-2'>
        <span className='text-red-500'>*</span> indicates required field
      </p>
      <hr className='border border-gray-300' />
      <div className='p-5'>
        <form onSubmit={formik.handleSubmit}>
          <div className='grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-4'>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                Select Vehicle <span className='text-red-500'>*</span>
              </label>
              <Autocomplete
                disablePortal
                options={vehicleOptions}
                isOptionEqualToValue={(o, v) => o.value === v.value}
                getOptionLabel={(o) => o.label}
                size='small'
                onChange={(_, v) => {
                  if (!isView) formik.setFieldValue('vehicle', v ? v.value : '');
                }}
                value={getOption(vehicleOptions, formik.values.vehicle)}
                renderInput={(params) => <TextField {...params} label='Select Vehicle' disabled={isView} required />}
                disabled={isView}
              />
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                Select Vehicle Route <span className='text-red-500'>*</span>
              </label>
              <Autocomplete
                disablePortal
                options={routeOptions}
                isOptionEqualToValue={(o, v) => o.value === v.value}
                getOptionLabel={(o) => o.label}
                size='small'
                onChange={(_, v) => {
                  if (!isView) formik.setFieldValue('route', v ? v.value : '');
                }}
                value={getOption(routeOptions, formik.values.route)}
                renderInput={(params) => (
                  <TextField {...params} label='Select Vehicle Route' disabled={isView} required />
                )}
                disabled={isView}
              />
            </div>
            {FIELDS.map(({ name, label }) => (
              <div key={name}>
                <label className='block mb-2 text-sm font-medium text-gray-900'>
                  {label} <span className='text-red-500'>*</span>
                </label>
                <TextField
                  size='small'
                  type='time'
                  name={name}
                  id={name}
                  fullWidth
                  required
                  value={formik.values[name]}
                  onChange={formik.handleChange}
                  disabled={isView}
                />
              </div>
            ))}
          </div>
          <div className='flex justify-end gap-4 mt-4'>
            {!isView && (
              <button
                type='submit'
                className='text-white bg-[#07163d] hover:bg-[#07163d]/90 focus:ring-4 focus:outline-none focus:ring-[#07163d]/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
                Save
              </button>
            )}
            <Link to='/master/plant-in-time'>
              <button
                type='button'
                className='text-white bg-gray-500 hover:bg-gray-500/90 focus:ring-4 focus:outline-none focus:ring-gray-500/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
                Back
              </button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PlantInTimeForm;
