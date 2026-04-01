import L from 'leaflet';
import { toast } from 'react-toastify';
import { APIURL } from '../../../../constants';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { useDropdownOpt } from '../../../../hooks/useDropdownOpt';
import { AddressServices } from '../../../../services';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { createEmployee, updateEmployee } from '../../../../redux/employeeSlice';
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import { Autocomplete, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';

const getOptionObj = (options, value, byLabel = false) => {
  if (byLabel) return options.find((o) => o.label === value) || null;
  return options.find((o) => o.value === value) || null;
};

function TextInput({ name, label, type = 'text', required, placeholder, formVal, setFormVal, disabled }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormVal((prev) => ({ ...prev, [name]: value }));
  };
  return (
    <div>
      <label className='block mb-2 text-sm font-medium text-gray-900'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <TextField
        size='small'
        name={name}
        type={type}
        value={formVal[name] || ''}
        onChange={handleChange}
        disabled={disabled}
        fullWidth
        required={required}
        placeholder={placeholder || label}
      />
    </div>
  );
}

function AutoSelect({ label, options, value, loading, onChange, required, disabled }) {
  return (
    <div>
      <label className='block mb-2 text-sm font-medium text-gray-900'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <Autocomplete
        disablePortal
        options={options}
        loading={loading}
        value={value}
        onChange={onChange}
        // Compare option value with current value to handle object equality
        isOptionEqualToValue={(o, v) => o?.value == v?.value}
        getOptionLabel={(o) => o?.label || ''}
        renderInput={(params) => <TextField {...params} size='small' fullWidth />}
        disabled={disabled}
      />
    </div>
  );
}

const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/854/854878.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  employeeId: '',
  punchId: '',
  email: '',
  phoneNumber: '',
  selectedDepartment: null,
  selectedPlant: null,
  dateOfJoining: '',
  selectedGender: '',
  vehicleRoute: null,
  boardingPoint: null,
  profilePhoto: '',
  address: '',
  latitude: '',
  longitude: '',
};

const isValidLatLng = (lat, lng) => {
  const a = +lat,
    b = +lng;
  return a >= -90 && a <= 90 && b >= -180 && b <= 180 && isFinite(a) && isFinite(b);
};

const formatLatLng = (v) => (v === '' || isNaN(Number(v)) ? '' : Number(v).toFixed(7));

function MapClickHandler({ onMapClick, disabled }) {
  useMapEvents({ click: (e) => !disabled && onMapClick?.(e.latlng) });
  return null;
}

function EmployeeForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { state: rowData } = useLocation();
  const companyID = localStorage.getItem('company_id');
  const isViewMode = rowData?.mode === 'view';
  const isEditMode = rowData?.mode === 'edit';

  const fileInputRef = useRef(null);
  const addressTimeoutRef = useRef(null);

  const [formVal, setFormVal] = useState(() => {
    const d = (rowData?.mode === 'edit' || rowData?.mode === 'view') ? rowData.rowData : null;
    if (d) {
      return {
        ...INITIAL_FORM,
        firstName: d.first_name || '',
        lastName: d.last_name || '',
        employeeId: d.employee_id || '',
        punchId: d.punch_id || '',
        email: d.email || '',
        phoneNumber: d.phone_number || '',
        dateOfJoining: d.date_of_joining || '',
        selectedGender: d.gender ?? '',
        address: d.address || '',
        latitude: d.latitude || d.boarding_latitude || '',
        longitude: d.longitude || d.boarding_longitude || '',
        // Placeholders for options-dependent fields
        selectedDepartment: d.department ? { label: d.department, value: null } : null,
        selectedPlant: d.plant ? { label: d.plant, value: null } : null,
        vehicleRoute: d.vehicle_route_name ? { label: d.vehicle_route_name, value: null } : null,
        boardingPoint: d.boarding_address ? { label: d.boarding_address, value: null } : null,
      };
    }
    return INITIAL_FORM;
  });

  const [addressOptions, setAddressOptions] = useState([]);

  const selectedAddress = useMemo(() => {
    if (formVal.latitude && formVal.longitude && formVal.address) {
      return {
        label: formVal.address,
        value: `${formVal.latitude}-${formVal.longitude}`,
        otherData: {
          display_name: formVal.address,
          lat: String(formVal.latitude),
          lon: String(formVal.longitude),
        },
      };
    }
    return null;
  }, [formVal.latitude, formVal.longitude, formVal.address]);

  const dept = useDropdownOpt({
    apiUrl: APIURL.DEPARTMENTS,
    queryParams: { company_id: companyID },
    dataKey: 'departments',
    labelSelector: (d) => d?.department_name ?? '',
    valueSelector: (d) => d.id,
  });

  const plant = useDropdownOpt({
    apiUrl: APIURL.PLANTS,
    queryParams: { company_id: companyID },
    dataKey: 'plants',
    labelSelector: (d) => d?.plant_name ?? '',
    valueSelector: (d) => d.id,
  });

  const route = useDropdownOpt({
    apiUrl: APIURL.VEHICLE_ROUTE,
    queryParams: { company_id: companyID },
    dataKey: 'routes',
    labelSelector: (d) => d?.name ?? '',
    valueSelector: (d) => d.id,
  });

  // Fetches stops when vehicleRoute changes
  const boarding = useDropdownOpt({
    apiUrl: formVal.vehicleRoute ? `${APIURL.VEHICLE_ROUTE}/${formVal.vehicleRoute.value}/stops` : null,
    dataKey: 'stops',
    labelSelector: (d) => d?.address ?? '',
    valueSelector: (d) => d?.id ?? '',
  });


  useEffect(() => {
    if (!rowData?.rowData || !['edit', 'view'].includes(rowData?.mode)) return;

    const d = rowData.rowData;
    const updates = {};

    if (dept.options?.length > 0) {
      const opt = getOptionObj(dept.options, d.department, true);
      if (opt && opt.value !== formVal.selectedDepartment?.value) updates.selectedDepartment = opt;
    }
    if (plant.options?.length > 0) {
      const opt = getOptionObj(plant.options, d.plant, true);
      if (opt && opt.value !== formVal.selectedPlant?.value) updates.selectedPlant = opt;
    }
    if (route.options?.length > 0) {
      const opt = getOptionObj(route.options, d.vehicle_route_name || d.vehicle_route_id, true);
      if (opt && opt.value !== formVal.vehicleRoute?.value) updates.vehicleRoute = opt;
    }
    if (boarding.options?.length > 0 && formVal.boardingPoint) {
      const opt = getOptionObj(boarding.options, formVal.boardingPoint.label, true);
      if (opt && (opt.value !== formVal.boardingPoint.value || !formVal.boardingPoint.data)) updates.boardingPoint = opt;
    }

    if (Object.keys(updates).length > 0) {
      setFormVal((prev) => ({ ...prev, ...updates }));
    }
  }, [
    rowData,
    dept.options,
    plant.options,
    route.options,
    boarding.options,
    formVal.selectedDepartment?.value,
    formVal.selectedPlant?.value,
    formVal.vehicleRoute?.value,
    formVal.boardingPoint,
  ]);

  const handleAddressSearch = useCallback((_, value) => {
    if (addressTimeoutRef.current) clearTimeout(addressTimeoutRef.current);
    if (!value) {
      setAddressOptions([]);
      return;
    }
    addressTimeoutRef.current = setTimeout(async () => {
      const res = await AddressServices.getLocationFromName(value);
      if (Array.isArray(res)) {
        setAddressOptions(
          res.map((item) => ({
            label: item.display_name,
            value: item.place_id,
            otherData: { ...item, lat: String(item.lat || ''), lon: String(item.lon || '') },
          })),
        );
      }
    }, 500);
  }, []);

  const handleAddressChange = useCallback((_, val) => {
    if (val?.otherData) {
      setFormVal((prev) => ({
        ...prev,
        address: val.otherData.display_name,
        latitude: val.otherData.lat,
        longitude: val.otherData.lon,
      }));
    } else if (!val) {
      setFormVal((prev) => ({ ...prev, address: '', latitude: '', longitude: '' }));
    }
  }, []);

  const handleMapClick = useCallback(
    async ({ lat, lng }) => {
      if (isViewMode) return;
      const res = await AddressServices.getLocationFromLatLng(lat, lng);
      const addr = Array.isArray(res) && res[0]?.display_name ? res[0].display_name : '';
      setFormVal((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng), address: addr || prev.address }));
    },
    [isViewMode],
  );

  const handleLatChange = (e) => {
    const newLat = e.target.value;
    setFormVal((prev) => ({ ...prev, latitude: newLat }));
  };

  const handleLngChange = (e) => {
    const newLng = e.target.value;
    setFormVal((prev) => ({ ...prev, longitude: newLng }));
  };

  const handleLatBlur = async () => {
    if (formVal.latitude && formVal.longitude && isValidLatLng(formVal.latitude, formVal.longitude)) {
      const res = await AddressServices.getLocationFromLatLng(formVal.latitude, formVal.longitude);
      const addr = Array.isArray(res) && res[0]?.display_name ? res[0].display_name : '';
      setFormVal((prev) => ({ ...prev, address: addr || prev.address }));
    }
  };

  const handleLngBlur = handleLatBlur;

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const lat = formatLatLng(formVal.latitude);
      const lng = formatLatLng(formVal.longitude);

      if (!isValidLatLng(lat, lng)) {
        toast.error('Invalid Latitude/Longitude');
        return;
      }

      const payload = {
        first_name: formVal.firstName,
        last_name: formVal.lastName,
        employee_id: formVal.employeeId,
        punch_id: formVal.punchId,
        email: formVal.email,
        phone_number: formVal.phoneNumber,
        department_id: formVal.selectedDepartment ? formVal.selectedDepartment.value : '',
        plant_id: formVal.selectedPlant ? formVal.selectedPlant.value : '',
        date_of_joining: formVal.dateOfJoining,
        gender: formVal.selectedGender,
        vehicle_route_id: formVal.vehicleRoute ? formVal.vehicleRoute.value : '',
        address: formVal.address,
        boarding_address: formVal.boardingPoint ? formVal.boardingPoint.value : '',
        boarding_latitude: formVal.boardingPoint?.data?.latitude ?? rowData?.rowData?.boarding_latitude ?? '',
        boarding_longitude: formVal.boardingPoint?.data?.longitude ?? rowData?.rowData?.boarding_longitude ?? '',
        profile_img: formVal.profilePhoto?.name || '',
        latitude: lat ? parseFloat(lat) : '',
        longitude: lng ? parseFloat(lng) : '',
        status_id: 1,
      };

      const action = isEditMode
        ? updateEmployee({ id: rowData.rowData.actual_id, formData: payload })
        : createEmployee(payload);

      dispatch(action).then((res) => {
        if (createEmployee.fulfilled.match(res) || updateEmployee.fulfilled.match(res)) {
          toast.success(`Employee ${isEditMode ? 'updated' : 'created'} successfully!`);
          navigate('/master/employee');
        } else {
          toast.error(res.payload || 'Error saving employee');
        }
      });
    },
    [formVal, isEditMode, rowData, navigate, dispatch],
  );

  const profileImageSrc = useMemo(() => {
    if (!formVal.profilePhoto) return null;
    return typeof formVal.profilePhoto === 'string' ? formVal.profilePhoto : URL.createObjectURL(formVal.profilePhoto);
  }, [formVal.profilePhoto]);

  const parsedLat = parseFloat(formVal.latitude);
  const parsedLng = parseFloat(formVal.longitude);
  const hasValidCoords = isValidLatLng(parsedLat, parsedLng);

  const mapCenter = hasValidCoords ? [parsedLat, parsedLng] : [12.9716, 77.5946];
  const markerPosition =
    formVal.latitude !== '' && formVal.longitude !== '' && isValidLatLng(formVal.latitude, formVal.longitude)
      ? [parseFloat(formVal.latitude), parseFloat(formVal.longitude)]
      : null;

  return (
    <div className='w-full p-2'>
      <div className='flex items-center gap-4 mb-4'>
        <button
          type='button'
          onClick={() => navigate(-1)}
          className='group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all duration-200 ease-in-out text-gray-700 font-medium text-sm active:scale-95 cursor-pointer'>
          <IoArrowBack className='w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1' />
          Back
        </button>
        <h1 className='text-2xl font-bold text-[#07163d]'>Employee</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <div className='bg-white rounded-sm border-t-4 border-[#07163d] p-5'>
            <h2 className='text-lg text-gray-700 mb-3 font-semibold'>Employee Details</h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
              <TextInput
                name='firstName'
                label='First Name'
                required
                placeholder='Enter first name'
                formVal={formVal}
                setFormVal={setFormVal}
                disabled={isViewMode}
              />
              <TextInput
                name='lastName'
                label='Last Name'
                placeholder='Enter last name'
                formVal={formVal}
                setFormVal={setFormVal}
                disabled={isViewMode}
              />
              <TextInput
                name='employeeId'
                label='Employee ID'
                required
                placeholder='e.g., EMP001'
                formVal={formVal}
                setFormVal={setFormVal}
                disabled={isViewMode}
              />
              <TextInput
                name='punchId'
                label='Punch ID'
                required
                placeholder='Enter punch ID'
                formVal={formVal}
                setFormVal={setFormVal}
                disabled={isViewMode}
              />
              <TextInput
                name='email'
                label='Email'
                type='email'
                required
                placeholder='example@company.com'
                formVal={formVal}
                setFormVal={setFormVal}
                disabled={isViewMode}
              />
              <TextInput
                name='phoneNumber'
                label='Phone Number'
                required
                placeholder='10-digit number'
                formVal={formVal}
                setFormVal={setFormVal}
                disabled={isViewMode}
              />

              <AutoSelect
                label='Department'
                options={dept.options}
                value={formVal.selectedDepartment}
                loading={dept.loading}
                onChange={(_, v) => setFormVal((p) => ({ ...p, selectedDepartment: v }))}
                required
                disabled={isViewMode}
              />

              <AutoSelect
                label='Plant'
                options={plant.options}
                value={formVal.selectedPlant}
                loading={plant.loading}
                onChange={(_, v) => setFormVal((p) => ({ ...p, selectedPlant: v }))}
                required
                disabled={isViewMode}
              />

              <TextInput
                name='dateOfJoining'
                label='Joining Date'
                type='date'
                required
                formVal={formVal}
                setFormVal={setFormVal}
                disabled={isViewMode}
              />

              <AutoSelect
                label='Route'
                options={route.options}
                value={formVal.vehicleRoute}
                loading={route.loading}
                onChange={(_, v) => setFormVal((p) => ({ ...p, vehicleRoute: v, boardingPoint: null }))}
                disabled={isViewMode}
              />

              <AutoSelect
                label='Boarding Point'
                options={boarding.options}
                value={formVal.boardingPoint}
                loading={boarding.loading}
                onChange={(_, v) => setFormVal((p) => ({ ...p, boardingPoint: v }))}
                disabled={isViewMode}
              />

              <FormControl>
                <FormLabel>
                  Gender <span className='text-red-500'>*</span>
                </FormLabel>
                <RadioGroup
                  value={formVal.selectedGender}
                  name='selectedGender'
                  onChange={(e) => setFormVal((prev) => ({ ...prev, selectedGender: e.target.value }))}>
                  <FormControlLabel value='Female' control={<Radio disabled={isViewMode} />} label='Female' />
                  <FormControlLabel value='Male' control={<Radio disabled={isViewMode} />} label='Male' />
                </RadioGroup>
              </FormControl>

              <div>
                <label className='block mb-2 text-sm font-medium'>Profile Image</label>
                <div
                  className='flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100'
                  onClick={() => !isViewMode && fileInputRef.current?.click()}
                  onDrop={
                    !isViewMode
                      ? (e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.length)
                            setFormVal((p) => ({ ...p, profilePhoto: e.dataTransfer.files[0] }));
                        }
                      : undefined
                  }
                  onDragOver={!isViewMode ? (e) => e.preventDefault() : undefined}
                  style={isViewMode ? { pointerEvents: 'none', opacity: 0.7 } : { cursor: 'pointer' }}>
                  <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                    <svg className='w-8 h-8 mb-4 text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' />
                    </svg>
                    <p className='text-sm text-gray-500'>
                      <span className='font-semibold'>Click</span> or drag image
                    </p>
                  </div>
                  <input
                    type='file'
                    ref={fileInputRef}
                    className='hidden'
                    accept='image/*'
                    onChange={(e) => setFormVal((p) => ({ ...p, profilePhoto: e.target.files?.[0] }))}
                  />
                </div>
                {profileImageSrc && (
                  <img src={profileImageSrc} alt='Profile' className='mt-2 w-24 h-24 object-cover rounded-md border' />
                )}
              </div>
            </div>
          </div>

          <div className='relatve bg-white rounded-sm border-t-4 border-[#07163d] p-5'>
            <h2 className='text-lg text-gray-700 mb-3 font-semibold'>Boarding Location</h2>

            <label className='block mb-2 text-sm font-medium text-gray-900'>
              Address <span className='text-red-500'>*</span>
            </label>
            <Autocomplete
              disablePortal
              options={addressOptions}
              value={selectedAddress}
              loadingText='Loading...'
              getOptionLabel={(opt) => opt.label || ''}
              onInputChange={handleAddressSearch}
              onChange={handleAddressChange}
              renderInput={(params) => <TextField {...params} size='small' fullWidth />}
              disabled={isViewMode}
            />

            <div className='grid grid-cols-2 gap-3 mt-3'>
              <div>
                <label className='block mb-2 text-sm font-medium text-gray-900'>Latitude</label>
                <TextField
                  size='small'
                  name='latitude'
                  value={formVal.latitude}
                  onChange={handleLatChange}
                  onBlur={handleLatBlur}
                  disabled={isViewMode}
                  fullWidth
                />
              </div>
              <div>
                <label className='block mb-2 text-sm font-medium text-gray-900'>Longitude</label>
                <TextField
                  size='small'
                  name='longitude'
                  value={formVal.longitude}
                  onChange={handleLngChange}
                  onBlur={handleLngBlur}
                  disabled={isViewMode}
                  fullWidth
                />
              </div>
            </div>

            <div className='h-[400px] mt-3'>
              <MapContainer
                center={mapCenter}
                zoom={13}
                className='h-full w-full rounded-md'
                key={JSON.stringify(mapCenter)}>
                <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
                {!isViewMode && <MapClickHandler onMapClick={handleMapClick} />}
                {markerPosition && (
                  <Marker position={markerPosition} icon={customIcon}>
                    <Popup>
                      <strong>{formVal.address || 'Selected Location'}</strong>
                      <br />
                      Lat: {formatLatLng(formVal.latitude)}, Lng: {formatLatLng(formVal.longitude)}
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
        </div>

        {!isViewMode && (
          <div className='mt-4 flex justify-end'>
            <button
              type='submit'
              className='px-4 py-2 bg-[#07163d] text-white rounded hover:bg-[#0b2154] transition-colors'>
              {isEditMode ? 'Update Employee' : 'Save Employee'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default EmployeeForm;
