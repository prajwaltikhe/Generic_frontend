import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { APIURL } from '../../../../constants';
import { useEffect, useMemo, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { useDropdownOpt } from '../../../../hooks/useDropdownOpt';
import { createVehicle, fetchVehicles, updateVehicle } from '../../../../redux/vehiclesSlice';

function VehicleForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state: rowData, pathname } = useLocation();
  const isView = pathname === '/master/vehicle/view' || (rowData?.action || '').toLowerCase() === 'view';

  const initialFormVal = useMemo(
    () => ({
      selectedDriver: '',
      vehicleName: '',
      vehicleNumber: '',
      simNumber: '',
      imeiNumber: '',
      vehicleOverspeed: '',
      seats: '',
    }),
    [],
  );
  const [formVal, setFormVal] = useState(initialFormVal);

  const {
    options: driverOptions,
    loading,
    error,
    refetch,
  } = useDropdownOpt({
    apiUrl: APIURL.DRIVER,
    query: { page: 1, limit: 150, search: '' },
    labelSelector: (d) => `${d.first_name} ${d.last_name}`,
    dataKey: 'drivers',
    valueSelector: (d) => d.id,
  });

  useEffect(() => {
    if (!rowData) return setFormVal(initialFormVal);
    let selectedDriver = rowData.selectedDriver || rowData.driverID || '';
    if ((rowData.action || '').toLowerCase() === 'edit' && rowData.driverName && driverOptions?.length) {
      const found = driverOptions.find(
        (opt) => (opt.label || '').trim().toLowerCase() === (rowData.driverName || '').trim().toLowerCase(),
      );
      if (found) selectedDriver = found.value;
    }
    setFormVal({
      selectedDriver,
      vehicleName: rowData.vehicleName || rowData.busName || '',
      vehicleNumber: rowData.vehicleNumber || rowData.busNumber || '',
      simNumber: rowData.simNumber || '',
      imeiNumber: rowData.imeiNumber || '',
      vehicleOverspeed: rowData.speedLimit ?? '',
      seats: rowData.seatCount ?? '',
    });
  }, [rowData, driverOptions, initialFormVal]);

  const handleChange = (e) => setFormVal((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const p = {
      vehicle_driver_id: formVal.selectedDriver,
      vehicle_name: formVal.vehicleName,
      vehicle_number: formVal.vehicleNumber,
      sim_number: formVal.simNumber,
      imei_number: formVal.imeiNumber,
      speed_limit: +formVal.vehicleOverspeed,
      seats: +formVal.seats,
      vehicle_status_id: 1,
    };
    try {
      rowData?.actual_id
        ? await dispatch(updateVehicle({ id: rowData.actual_id, payload: p })).unwrap()
        : await dispatch(createVehicle(p)).unwrap();
      dispatch(fetchVehicles({ page: 1, limit: 10 }));
      toast.success('Vehicle saved successfully!');
      setFormVal(initialFormVal);
      navigate('/master/vehicle');
    } catch (err) {
      toast.error(err?.message || err || 'Something went wrong');
    }
  };

  const v = (key, alt) => (isView ? (rowData?.[key] ?? rowData?.[alt] ?? '') : formVal[key]);

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center mb-4'>
        <div className='flex items-center gap-4'>
          <button
            type='button'
            onClick={() => navigate(-1)}
            className='group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all duration-200 ease-in-out text-gray-700 font-medium text-sm active:scale-95 cursor-pointer'>
            <IoArrowBack className='w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1' />
            Back
          </button>
          <h1 className='text-2xl font-bold text-[#07163d]'>Vehicle</h1>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className='grid grid-col-1 gap-3'>
          <div className='bg-white rounded-sm border-t-3 border-b-3 border-[#07163d]'>
            <h2 className='text-lg p-3 text-gray-700'>Vehicle Detail</h2>
            <hr className='border border-gray-300' />
            <div className='p-5'>
              <div className='grid grid-col-1 md:grid-cols-2 gap-3'>
                {/* Driver */}
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Select Vehicle Driver <span className='text-red-500'>*</span>
                  </label>
                  {isView ? (
                    <TextField size='small' fullWidth disabled value={rowData?.driverName || ''} label='Driver Name' />
                  ) : (
                    <Autocomplete
                      disablePortal
                      options={driverOptions}
                      loading={loading}
                      value={driverOptions.find((opt) => opt.value === formVal.selectedDriver) || null}
                      onChange={(_, n) => setFormVal((f) => ({ ...f, selectedDriver: n ? n.value : '' }))}
                      isOptionEqualToValue={(o, v) => o?.value === v?.value}
                      getOptionLabel={(opt) => opt?.label || ''}
                      size='small'
                      renderInput={(params) => (
                        <TextField {...params} label='Select Vehicle Driver' size='small' fullWidth />
                      )}
                    />
                  )}
                  {error && !isView && (
                    <p className='text-red-500 text-sm mt-1'>
                      Failed to load drivers.{' '}
                      <button
                        onClick={refetch}
                        className='text-blue-600 underline hover:text-blue-800 transition-colors duration-200'>
                        Retry
                      </button>
                    </p>
                  )}
                </div>
                {/* Name */}
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Vehicle Name <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    disabled={isView}
                    type='text'
                    name='vehicleName'
                    fullWidth
                    required
                    placeholder='Vehicle Name'
                    value={v('vehicleName', 'busName')}
                    onChange={handleChange}
                  />
                </div>
                {/* Number */}
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Vehicle Number <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    disabled={isView}
                    type='text'
                    name='vehicleNumber'
                    fullWidth
                    required
                    placeholder='Vehicle Number'
                    value={v('vehicleNumber', 'busNumber')}
                    onChange={handleChange}
                  />
                </div>
                {/* SIM Number */}
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    SIM No <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    disabled={isView}
                    type='text'
                    name='simNumber'
                    fullWidth
                    required
                    placeholder='SIM No'
                    value={v('simNumber')}
                    onChange={handleChange}
                  />
                </div>
                {/* IMEI */}
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    IMEI Number <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    disabled={isView}
                    type='text'
                    name='imeiNumber'
                    fullWidth
                    required
                    placeholder='IMEI Number'
                    value={v('imeiNumber')}
                    onChange={handleChange}
                  />
                </div>
                {/* Overspeed */}
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Vehicle Overspeed <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    disabled={isView}
                    type='number'
                    name='vehicleOverspeed'
                    fullWidth
                    required
                    placeholder='Vehicle Overspeed'
                    value={isView ? (rowData?.speedLimit ?? '') : formVal.vehicleOverspeed}
                    onChange={handleChange}
                  />
                </div>
                {/* Seats */}
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Seats <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    disabled={isView}
                    type='number'
                    name='seats'
                    fullWidth
                    required
                    placeholder='Seats'
                    value={isView ? (rowData?.seatCount ?? '') : formVal.seats}
                    onChange={handleChange}
                  />
                </div>
                {isView && (
                  <>
                    <div>
                      <label className='block mb-2 text-sm font-medium text-gray-900'>Driver Email</label>
                      <TextField
                        size='small'
                        fullWidth
                        disabled
                        value={rowData?.driverEmail || ''}
                        label='Driver Email'
                      />
                    </div>
                    <div>
                      <label className='block mb-2 text-sm font-medium text-gray-900'>Driver Phone Number</label>
                      <TextField
                        size='small'
                        fullWidth
                        disabled
                        value={rowData?.driverPhoneNumber || ''}
                        label='Driver Phone Number'
                      />
                    </div>
                    <div>
                      <label className='block mb-2 text-sm font-medium text-gray-900'>Route Number</label>
                      <TextField
                        size='small'
                        fullWidth
                        disabled
                        value={rowData?.routeNumber || ''}
                        label='Route Number'
                      />
                    </div>
                    <div>
                      <label className='block mb-2 text-sm font-medium text-gray-900'>Route Name</label>
                      <TextField size='small' fullWidth disabled value={rowData?.routeName || ''} label='Route Name' />
                    </div>
                    <div>
                      <label className='block mb-2 text-sm font-medium text-gray-900'>Status</label>
                      <TextField size='small' fullWidth disabled value={rowData?.status || ''} label='Status' />
                    </div>
                    <div>
                      <label className='block mb-2 text-sm font-medium text-gray-900'>Created At</label>
                      <TextField size='small' fullWidth disabled value={rowData?.createdAt || ''} label='Created At' />
                    </div>
                  </>
                )}
              </div>
              <div className='flex justify-end gap-4 mt-4'>
                {!isView && (
                  <button
                    type='submit'
                    className='text-white bg-[#07163d] hover:bg-[#07163d]/90 focus:ring-4 focus:outline-none focus:ring-[#07163d]/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
                    Save
                  </button>
                )}
                <button
                  type='button'
                  className='text-white bg-gray-500 hover:bg-gray-500/90 focus:ring-4 focus:outline-none focus:ring-gray-500/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'
                  onClick={() => navigate('/master/vehicle')}>
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default VehicleForm;
