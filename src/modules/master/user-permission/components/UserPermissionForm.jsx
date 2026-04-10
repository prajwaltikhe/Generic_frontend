import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';
import { Autocomplete, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import ApiService from '../../../../services/ApiService';
import { APIURL } from '../../../../constants';
import { getRoleFromStorage } from '../../../../utils/roles';

const fields = [
  { label: 'Employee ID', name: 'employeeId', type: 'text' },
  { label: 'Name', name: 'name', type: 'text' },
  { label: 'Phone Number', name: 'phoneNumber', type: 'text' },
  { label: 'Password', name: 'password', type: 'password' },
  { label: 'Email', name: 'email', type: 'email' },
];

function TextInput({ name, label, type = 'text', required, placeholder, value, onChange, disabled = false }) {
  return (
    <div>
      <label className='block mb-2 text-sm font-medium text-gray-900'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <TextField
        size='small'
        type={type}
        name={name}
        id={name}
        fullWidth
        placeholder={placeholder || `Enter ${label}`}
        required={required}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

function AutoSelect({ label, required, options, value, onChange, getOptionLabel, loading, placeholder, disabled = false }) {
  return (
    <div>
      <label className='block mb-2 text-sm font-medium text-gray-900'>
        {label} {required && <span className='text-red-500'>*</span>}
      </label>
      <Autocomplete
        disablePortal
        options={options}
        getOptionLabel={getOptionLabel}
        size='small'
        loading={loading}
        onChange={onChange}
        isOptionEqualToValue={(a, b) => a?.id === b?.id}
        value={value}
        disabled={disabled}
        renderInput={(params) => <TextField {...params} placeholder={placeholder} />}
      />
    </div>
  );
}

export default function UserPermissionForm() {
  const rowData = useLocation().state?.row || null;
  const isEdit = Boolean(rowData?.id);
  const isSelfEdit = Boolean(rowData?.is_self);
  const selfRole = String(rowData?.role || '').toLowerCase();
  const navigate = useNavigate();
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ plants: [], departments: [], create_roles: [] });
  const [formValues, setFormValues] = useState({
    employeeId: rowData?.employee_id || '',
    name: rowData?.name || '',
    phoneNumber: rowData?.phone_number || '',
    department: rowData?.department_id || '',
    plant: rowData?.plant_id || '',
    password: '',
    email: rowData?.email || '',
    role: rowData?.role || 'operator',
  });

  const handleChange = (e) => setFormValues((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSelect = (key, val) => setFormValues((f) => ({ ...f, [key]: val ? val.id : '' }));

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await ApiService.get(`${APIURL.PORTAL_USERS}/meta`);
        if (!mounted) return;
        setMeta({
          plants: res?.data?.plants || [],
          departments: res?.data?.departments || [],
          create_roles: res?.data?.create_roles || [],
        });
      } catch (e) {
        toast.error(e?.response?.data?.message || e?.message || 'Failed to load metadata');
      } finally {
        if (mounted) setLoadingMeta(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const roleOptions = useMemo(() => {
    const fromServer = (meta.create_roles || []).map((r) => ({ id: r, label: r[0].toUpperCase() + r.slice(1) }));
    if (isEdit && formValues.role && !fromServer.some((r) => r.id === formValues.role)) {
      const actorRole = getRoleFromStorage();
      if (actorRole === 'superadmin' || actorRole === 'admin') {
        return [...fromServer, { id: formValues.role, label: formValues.role[0].toUpperCase() + formValues.role.slice(1) }];
      }
    }
    return fromServer;
  }, [meta.create_roles, isEdit, formValues.role]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (loadingMeta || saving) return;
    if (!formValues.department || !formValues.plant) {
      toast.error('Department and plant are required');
      return;
    }
    if (!isEdit && !formValues.password.trim()) {
      toast.error('Password is required for new user');
      return;
    }
    if (!/^\d{10,15}$/.test(formValues.phoneNumber.trim())) {
      toast.error('Phone number must be 10 to 15 digits');
      return;
    }
    setSaving(true);
    const body = {
      employee_id: formValues.employeeId.trim(),
      name: formValues.name.trim(),
      email: formValues.email.trim(),
      phone_number: formValues.phoneNumber.trim(),
      role: formValues.role,
      department_id: formValues.department,
      plant_id: formValues.plant,
    };
    if (formValues.password.trim()) body.password = formValues.password;
    const req = isEdit
      ? ApiService.put(`${APIURL.PORTAL_USERS}/${rowData.id}`, body)
      : ApiService.post(`${APIURL.PORTAL_USERS}`, body);
    req
      .then((res) => {
        toast.success(res?.message || (isEdit ? 'User updated' : 'User created'));
        navigate('/master/user-permission');
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || err?.message || 'Save failed');
      })
      .finally(() => setSaving(false));
  };

  return (
    <div className='w-full h-full p-2'>
      <div className='flex items-center gap-3 mb-3'>
        <button
          type='button'
          onClick={() => navigate(-1)}
          className='group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all duration-200 ease-in-out text-gray-700 font-medium text-sm active:scale-95 cursor-pointer'>
          <IoArrowBack className='w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1' />
          Back
        </button>
        <h1 className='text-2xl font-bold text-[#07163d]'>{isEdit ? 'Edit Portal User' : 'Add Portal User'}</h1>
      </div>
      <div className='bg-white rounded-sm border-t-3 border-b-3 border-[#07163d]'>
      <p className='mx-3 pt-3 mb-2'>
        <span className='text-red-500'>*</span> indicates required field
      </p>
      {isSelfEdit && (
        <p className='mx-3 mb-2 text-xs text-gray-600'>
          {selfRole === 'admin'
            ? 'For your own account, only Employee ID, Name, Email and Phone Number can be updated here.'
            : 'For your own account, only Name, Email, Phone Number and Password can be updated here.'}
        </p>
      )}
      <hr className='border border-gray-300' />
      <div className='p-5'>
        <form onSubmit={handleFormSubmit}>
          <div className='grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-4'>
            {fields.map((f) => (
              <TextInput
                key={f.name}
                name={f.name}
                label={f.label}
                type={f.type}
                required={f.name !== 'password' || !isEdit}
                value={formValues[f.name]}
                onChange={handleChange}
                placeholder={f.name === 'password' ? 'Enter Password' : `Enter ${f.label}`}
                disabled={
                  isSelfEdit &&
                  (selfRole === 'admin'
                    ? !['employeeId', 'name', 'email', 'phoneNumber'].includes(f.name)
                    : !['name', 'email', 'phoneNumber', 'password'].includes(f.name))
                }
              />
            ))}
            <AutoSelect
              label='User Type'
              required
              options={roleOptions}
              loading={loadingMeta}
              value={roleOptions.find((opt) => opt.id === formValues.role) || null}
              onChange={(_, v) => setFormValues((f) => ({ ...f, role: v?.id || '' }))}
              getOptionLabel={(o) => o.label || ''}
              placeholder='Select User Type'
              disabled={isSelfEdit}
            />
            <AutoSelect
              label='Select Department'
              required
              options={meta.departments}
              loading={loadingMeta}
              value={meta.departments.find((opt) => opt.id === formValues.department) || null}
              onChange={(_, v) => handleSelect('department', v)}
              getOptionLabel={(o) => o.name || ''}
              placeholder='Select Department'
              disabled={isSelfEdit}
            />
            <AutoSelect
              label='Select Plant'
              required
              options={meta.plants}
              loading={loadingMeta}
              value={meta.plants.find((opt) => opt.id === formValues.plant) || null}
              onChange={(_, v) => handleSelect('plant', v)}
              getOptionLabel={(o) => o.name || ''}
              placeholder='Select Plant'
              disabled={isSelfEdit}
            />
          </div>
          <div className='flex justify-end gap-4 mt-4'>
            <button
              type='submit'
              disabled={saving}
              className='text-white bg-[#07163d] hover:bg-[#07163d]/90 focus:ring-4 focus:outline-none focus:ring-[#07163d]/30 font-medium rounded-md text-sm px-5 py-2.5 text-center cursor-pointer'>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
