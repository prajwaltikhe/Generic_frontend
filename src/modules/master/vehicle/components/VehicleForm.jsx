import { toast } from 'react-toastify';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { APIURL } from '../../../../constants';
import { Autocomplete, TextField } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDropdownOpt } from '../../../../hooks/useDropdownOpt';
import { createVehicle, fetchVehicles, updateVehicle } from '../../../../redux/vehiclesSlice';

function VehicleForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const rowData = location.state;
  const isViewMode =
    location.pathname === '/master/vehicle/view' ||
    (rowData && (rowData.action === 'VIEW' || rowData.action === 'view'));

  const initialFormVal = {
    selectedDriver: '',
    vehicleName: '',
    vehicleNumber: '',
    simNumber: '',
    imeiNumber: '',
    vehicleOverspeed: '',
    seats: '',
  };

  const [formVal, setFormVal] = useState(initialFormVal);

  const {
    options: driverOptions,
    loading,
    error,
    refetch,
  } = useDropdownOpt({
    apiUrl: APIURL.DRIVER,
    query: { page: 1, limit: 10, search: '' },
    labelSelector: (d) => `${d.first_name} ${d.last_name}`,
    dataKey: 'drivers',
    valueSelector: (d) => d.id,
  });

  useEffect(() => {
    if (rowData) {
      setFormVal({
        selectedDriver: rowData.selectedDriver || rowData.driverID || '',
        vehicleName: rowData.vehicleName || rowData.busName || '',
        vehicleNumber: rowData.vehicleNumber || rowData.busNumber || '',
        simNumber: rowData.simNumber || '',
        imeiNumber: rowData.imeiNumber || '',
        vehicleOverspeed: rowData.speedLimit !== undefined ? rowData.speedLimit : '',
        seats: rowData.seatCount !== undefined ? rowData.seatCount : '',
      });
    }
  }, [rowData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormVal((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      vehicle_driver_id: formVal.selectedDriver,
      vehicle_name: formVal.vehicleName,
      vehicle_number: formVal.vehicleNumber,
      sim_number: formVal.simNumber,
      imei_number: formVal.imeiNumber,
      speed_limit: parseInt(formVal.vehicleOverspeed),
      seats: parseInt(formVal.seats),
      vehicle_status_id: 1,
    };

    try {
      if (rowData && rowData.actual_id) {
        await dispatch(updateVehicle({ id: rowData.actual_id, payload })).unwrap();
      } else {
        await dispatch(createVehicle(payload)).unwrap();
      }
      dispatch(fetchVehicles({ page: 1, limit: 10 }));
      toast.success('Vehicle saved successfully!');
      setFormVal(initialFormVal);
      navigate('/master/vehicle');
    } catch (err) {
      toast.error(err?.message || err || 'Something went wrong');
    }
  };

  return (
    <div className='w-full h-full p-2'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold mb-4 text-[#07163d]'>Vehicle</h1>
      </div>
      <form onSubmit={handleFormSubmit}>
        <div className='grid grid-col-1 gap-3'>
          <div className='bg-white rounded-sm border-t-3 border-b-3 border-[#07163d]'>
            <h2 className='text-lg p-3 text-gray-700'>Vehicle Detail</h2>
            <hr className='border border-gray-300' />
            <div className='p-5'>
              <div className='grid grid-col-1 md:grid-cols-2 gap-3'>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Select Vehicle Driver <span className='text-red-500'>*</span>
                  </label>
                  {isViewMode ? (
                    <TextField size='small' fullWidth disabled value={rowData?.driverName || ''} label='Driver Name' />
                  ) : (
                    <Autocomplete
                      disabled={isViewMode}
                      disablePortal
                      options={driverOptions}
                      loading={loading}
                      value={driverOptions.find((opt) => opt.value === formVal.selectedDriver) || null}
                      onChange={(event, newValue) => {
                        setFormVal((prev) => ({
                          ...prev,
                          selectedDriver: newValue ? newValue.value : '',
                        }));
                      }}
                      isOptionEqualToValue={(option, value) => option.value === value}
                      getOptionLabel={(option) => option?.label || ''}
                      size='small'
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label='Select Vehicle Driver'
                          size='small'
                          fullWidth
                          value={driverOptions.find((opt) => opt.value === formVal.selectedDriver) || null}
                        />
                      )}
                    />
                  )}

                  {error && !isViewMode && (
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

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Vehicle Name <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    disabled={isViewMode}
                    type='text'
                    name='vehicleName'
                    id='vehicleName'
                    fullWidth
                    required
                    placeholder='Vehicle Name'
                    value={isViewMode ? rowData?.vehicleName || '' : formVal.vehicleName}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Vehicle Number <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='text'
                    name='vehicleNumber'
                    id='vehicleNumber'
                    disabled={isViewMode}
                    fullWidth
                    placeholder='Vehicle Number'
                    required
                    value={isViewMode ? rowData?.vehicleNumber || '' : formVal.vehicleNumber}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    SIM No <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='text'
                    disabled={isViewMode}
                    name='simNumber'
                    id='simNumber'
                    fullWidth
                    placeholder='SIM No'
                    required
                    value={isViewMode ? rowData?.simNumber || '' : formVal.simNumber}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    IMEI Number <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='text'
                    name='imeiNumber'
                    id='imeiNumber'
                    fullWidth
                    disabled={isViewMode}
                    placeholder='IMEI Number'
                    required
                    value={isViewMode ? rowData?.imeiNumber || '' : formVal.imeiNumber}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Vehicle Overspeed <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='number'
                    name='vehicleOverspeed'
                    id='vehicleOverspeed'
                    fullWidth
                    placeholder='Vehicle Overspeed'
                    required
                    disabled={isViewMode}
                    value={
                      isViewMode
                        ? rowData?.speedLimit !== undefined
                          ? rowData.speedLimit
                          : ''
                        : formVal.vehicleOverspeed
                    }
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Seats <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='number'
                    name='seats'
                    id='seats'
                    fullWidth
                    placeholder='Seats'
                    required
                    disabled={isViewMode}
                    value={isViewMode ? (rowData?.seatCount !== undefined ? rowData.seatCount : '') : formVal.seats}
                    onChange={handleChange}
                  />
                </div>

                {isViewMode && (
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
                {!isViewMode && (
                  <button
                    type='submit'
                    className='text-white bg-[#07163d] hover:bg-[#07163d]/90 focus:ring-4 focus:outline-none focus:ring-[#07163d]/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
                    Save
                  </button>
                )}

                <button
                  type='button'
                  className='text-white bg-gray-500 hover:bg-gray-500/90 focus:ring-4 focus:outline-none focus:ring-gray-500/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'
                  onClick={() => {
                    navigate('/master/vehicle');
                  }}>
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
