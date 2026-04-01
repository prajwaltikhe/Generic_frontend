import L from 'leaflet';
import { toast } from 'react-toastify';
import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Autocomplete, TextField } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { AddressServices } from '../../../../services';
import { createDriver, updateDriver } from '../../../../redux/driverSlice';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const DriverForm = () => {
  const location = useLocation();
  const { state: rowData } = location;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const addressTimeoutRef = useRef(null);
  const [addressOnSearch, setAddressOnSearch] = useState([]);

  const isViewMode = rowData?.mode === 'view';
  const readOnly = isViewMode;
  const showSaveButton = !readOnly;

  const [formValues, setFormValues] = useState(() => {
    const d = (rowData?.mode === 'edit' || rowData?.mode === 'view') ? rowData.rowData : null;
    const [firstName = '', ...rest] = d?.driverName?.split(' ') || [];
    return {
      firstName,
      lastName: rest.join(' ') || '',
      punchId: d?.punchId || '',
      email: d?.driverEmail || '',
      phoneNumber: d?.phoneNumber || '',
      drivingLicenceNo: d?.drivingLicenceNo || '',
      drivingLicenceIssueDate: d?.drivingLicenceIssueDate || '',
      drivingLicenceExpiryDate: d?.drivingLicenceExpiryDate || '',
      profilePhoto: d?.profilePhoto || '',
      address: d?.address || '',
      latitude: d?.latitude || '',
      longitude: d?.longitude || '',
    };
  });

  const [selectedAddressOption, setSelectedAddressOption] = useState(() => {
    const d = (rowData?.mode === 'edit' || rowData?.mode === 'view') ? rowData.rowData : null;
    return d?.address ? { label: d.address, value: d.place_id || null } : null;
  });

  const handleChange = (e) => {
    if (readOnly) return;
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleDrop = (e) => {
    if (readOnly) return;
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setFormValues((prev) => ({ ...prev, profilePhoto: file }));
      e.dataTransfer.clearData();
    }
  };


  const handleDragOver = (e) => {
    if (readOnly) return;
    e.preventDefault();
  };

  const convertFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (readOnly) return;
    let profileImageBytes = null;

    try {
      if (formValues.profilePhoto instanceof File) {
        profileImageBytes = await convertFileToBase64(formValues.profilePhoto);
      } else if (typeof formValues.profilePhoto === 'string' && formValues.profilePhoto !== '') {
        profileImageBytes = formValues.profilePhoto;
      }

      const payload = {
        first_name: formValues.firstName,
        last_name: formValues.lastName,
        punch_id: formValues.punchId ? parseInt(formValues.punchId) : null,
        email: formValues.email,
        phone_number: formValues.phoneNumber,
        driving_licence: formValues.drivingLicenceNo,
        driving_licence_issue_date: formValues.drivingLicenceIssueDate
          ? new Date(formValues.drivingLicenceIssueDate).toISOString()
          : null,
        driving_licence_expire_date: formValues.drivingLicenceExpiryDate
          ? new Date(formValues.drivingLicenceExpiryDate).toISOString()
          : null,
        latitude: formValues.latitude,
        longitude: formValues.longitude,
        address: formValues.address,
        status_id: 1,
        profile_photo: profileImageBytes,
      };

      const action = rowData?.rowData
        ? updateDriver({ id: rowData.rowData.actual_id, payload })
        : createDriver(payload);

      dispatch(action).then((res) => {
        if (createDriver.fulfilled.match(res) || updateDriver.fulfilled.match(res)) {
          toast.success(rowData?.rowData ? 'Driver updated successfully' : 'Driver created successfully');
          navigate('/master/driver');
        } else {
          toast.error(res.payload || `Failed to ${rowData?.rowData ? 'update' : 'create'} driver.`);
        }
      });
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

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
          <h1 className='text-2xl font-bold text-[#07163d]'>Vehicle Driver</h1>
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className='grid grid-col-1 md:grid-cols-2 gap-3'>
          <div className='bg-white rounded-sm border-t-3 border-[#07163d]'>
            <h2 className='text-lg p-3 text-gray-700'>Vehicle Driver Detail</h2>
            <hr className='border border-gray-300' />
            <div className='p-5'>
              <div className='grid grid-col-1 md:grid-cols-2 gap-3'>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    First Name <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='text'
                    name='firstName'
                    id='firstName'
                    fullWidth
                    required
                    placeholder='Driver First Name'
                    value={formValues.firstName}
                    onChange={handleChange}
                    InputProps={{ readOnly: readOnly }}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Last Name <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='text'
                    name='lastName'
                    id='lastName'
                    fullWidth
                    required
                    placeholder='Last Name'
                    value={formValues.lastName}
                    onChange={handleChange}
                    InputProps={{ readOnly: readOnly }}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Punch Id <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='text'
                    name='punchId'
                    id='punchId'
                    fullWidth
                    required
                    placeholder='Punch Id'
                    value={formValues.punchId}
                    onChange={handleChange}
                    InputProps={{ readOnly: readOnly }}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Email <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='email'
                    name='email'
                    id='email'
                    fullWidth
                    required
                    placeholder='Email'
                    value={formValues.email}
                    onChange={handleChange}
                    InputProps={{ readOnly: readOnly }}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Phone Number <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='number'
                    name='phoneNumber'
                    id='phoneNumber'
                    fullWidth
                    required
                    placeholder='Phone Number'
                    value={formValues.phoneNumber}
                    onChange={handleChange}
                    InputProps={{ readOnly: readOnly }}
                  />
                </div>


                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Driving Licence No. <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='text'
                    name='drivingLicenceNo'
                    id='drivingLicenceNo'
                    fullWidth
                    required
                    placeholder='Driving Licence No.'
                    value={formValues.drivingLicenceNo}
                    onChange={handleChange}
                    InputProps={{ readOnly: readOnly }}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Driving Licence issue date <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='date'
                    name='drivingLicenceIssueDate'
                    id='drivingLicenceIssueDate'
                    fullWidth
                    required
                    placeholder='Driving Licence issue date'
                    value={formValues.drivingLicenceIssueDate}
                    onChange={handleChange}
                    InputProps={{ readOnly: readOnly }}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Driving Licence expiry date <span className='text-red-500'>*</span>
                  </label>
                  <TextField
                    size='small'
                    type='date'
                    name='drivingLicenceExpiryDate'
                    id='drivingLicenceExpiryDate'
                    fullWidth
                    required
                    placeholder='Driving Licence expiry date'
                    value={formValues.drivingLicenceExpiryDate}
                    onChange={handleChange}
                    InputProps={{ readOnly: readOnly }}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>Profile Image</label>
                  <div className='flex items-center justify-center w-full'>
                    <div
                      className={
                        'flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg ' +
                        (readOnly ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer bg-gray-50 hover:bg-gray-100')
                      }
                      onClick={() => !readOnly && fileInputRef.current && fileInputRef.current.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}>
                      <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                        <svg
                          className='w-8 h-8 mb-4 text-gray-500'
                          aria-hidden='true'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 20 16'>
                          <path
                            stroke='currentColor'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
                          />
                        </svg>
                        <p className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
                          <span className='font-semibold'>Click to upload</span> or drag and drop
                        </p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>
                          SVG, PNG, JPG or GIF (MAX. 800x400px)
                        </p>
                      </div>
                      <input
                        type='file'
                        accept='image/*'
                        ref={fileInputRef}
                        className='hidden'
                        name='profilePhoto'
                        id='profilePhoto'
                        onChange={(e) => {
                          if (readOnly) return;
                          if (e.target.files.length > 0) {
                            const file = e.target.files[0];
                            setFormValues((prev) => ({ ...prev, profilePhoto: file }));
                          }
                        }}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                  {formValues.profilePhoto && (
                    <img
                      src={
                        typeof formValues.profilePhoto === 'string'
                          ? formValues.profilePhoto.startsWith('data:') || formValues.profilePhoto.startsWith('http')
                            ? formValues.profilePhoto
                            : `data:image/jpeg;base64,${formValues.profilePhoto}`
                          : URL.createObjectURL(formValues.profilePhoto)
                      }
                      alt='Preview'
                      className='w-24 h-24 object-cover rounded-full border mt-3'
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className='bg-white rounded-sm border-t-3 border-[#07163d]'>
            <h2 className='text-lg p-3 text-gray-700'>Vehicle Driver Address</h2>
            <hr className='border border-gray-300' />
            <div className='p-5'>
              <div className='grid grid-col-1 md:grid-cols-1 gap-3'>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>Address</label>
                  <Autocomplete
                    disablePortal
                    options={addressOnSearch?.map((item) => {
                      return { label: item.display_name, value: item.place_id, otherData: item };
                    })}
                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                    getOptionLabel={(option) => option.label}
                    size='small'
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label='Address'
                        InputProps={{ ...params.InputProps, readOnly: readOnly }}
                      />
                    )}
                    onInputChange={
                      readOnly
                        ? undefined
                        : (event, value) => {
                            if (addressTimeoutRef.current) clearTimeout(addressTimeoutRef.current);
                            addressTimeoutRef.current = setTimeout(async () => {
                              if (value) setAddressOnSearch((await AddressServices.getLocationFromName(value)) || []);
                            }, 500);
                          }
                    }
                    value={selectedAddressOption}
                    onChange={
                      readOnly
                        ? undefined
                        : (event, value) => {
                            if (value) {
                              setSelectedAddressOption(value);
                              setFormValues((prev) => ({
                                ...prev,
                                address: value.otherData.display_name,
                                latitude: value.otherData.lat,
                                longitude: value.otherData.lon,
                              }));
                            } else {
                              setSelectedAddressOption(null);
                              setFormValues((prev) => ({ ...prev, address: '', latitude: '', longitude: '' }));
                            }
                          }
                    }
                    readOnly={readOnly}
                    disabled={readOnly}
                  />
                </div>
              </div>
              <div className='grid grid-col-1 md:grid-cols-2 gap-3 mt-3'>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>Latitude</label>
                  <TextField
                    size='small'
                    type='text'
                    name='latitude'
                    id='latitude'
                    fullWidth
                    placeholder='Latitude'
                    value={formValues.latitude}
                    onChange={handleChange}
                    InputProps={{ readOnly: readOnly }}
                  />
                </div>

                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>Longitude</label>
                  <TextField
                    size='small'
                    type='text'
                    name='longitude'
                    id='longitude'
                    fullWidth
                    placeholder='Longitude'
                    value={formValues.longitude}
                    onChange={handleChange}
                    InputProps={{ readOnly: readOnly }}
                  />
                </div>
              </div>
              <div className='grid grid-col-1 md:grid-cols-1 gap-3 mt-3'>
                <div>
                  <label className='block mb-2 text-sm font-medium text-gray-900'>
                    Map <span className='text-red-500'>*</span>
                  </label>
                  <div className='map w-full h-70 bg-gray-500 rounded-2xl'>
                    <MapContainer
                      center={
                        formValues.latitude && formValues.longitude
                          ? [parseFloat(formValues.latitude), parseFloat(formValues.longitude)]
                          : [20.5937, 78.9629]
                      }
                      zoom={formValues.latitude && formValues.longitude ? 15 : 5}
                      className='w-full h-full'>
                      <TileLayer
                        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        attribution='&copy; OpenStreetMap contributors'
                      />
                      {formValues.latitude && formValues.longitude ? (
                        <Marker
                          key={formValues.latitude + ',' + formValues.longitude}
                          position={[parseFloat(formValues.latitude), parseFloat(formValues.longitude)]}
                          icon={customIcon}>
                          <Popup>
                            <div>
                              <strong>{formValues.address}</strong>
                            </div>
                          </Popup>
                        </Marker>
                      ) : null}
                    </MapContainer>
                  </div>
                </div>
              </div>

              <div className='flex justify-end gap-4 mt-4'>
                {showSaveButton && (
                  <button
                    type='submit'
                    className='text-white bg-[#07163d] hover:bg-[#07163d]/90 focus:ring-4 focus:outline-none focus:ring-[#07163d]/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
                    Save
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DriverForm;
