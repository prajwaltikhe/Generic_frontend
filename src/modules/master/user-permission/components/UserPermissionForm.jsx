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
  { label: 'Password', name: 'password', type: 'password' },
  { label: 'Email', name: 'email', type: 'email' },
];

export default function UserPermissionForm() {
  const rowData = useLocation().state?.row || null;
  const isEdit = Boolean(rowData?.id);
  const navigate = useNavigate();
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({ plants: [], departments: [], create_roles: [] });
  const [formValues, setFormValues] = useState({
    employeeId: rowData?.employee_id || '',
    name: rowData?.name || '',
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
    setSaving(true);
    const body = {
      employee_id: formValues.employeeId.trim(),
      name: formValues.name.trim(),
      email: formValues.email.trim(),
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
    <div className='bg-white rounded-sm border-t-3 border-b-3 border-[#07163d]'>
      <div className='flex items-center gap-4 p-3'>
        <button
          type='button'
          onClick={() => navigate(-1)}
          className='group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:shadow transition-all duration-200 ease-in-out text-gray-700 font-medium text-sm active:scale-95 cursor-pointer'>
          <IoArrowBack className='w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1' />
          Back
        </button>
        <h1 className='text-2xl font-bold text-[#07163d]'>{isEdit ? 'Edit Portal User' : 'Add Portal User'}</h1>
      </div>
      <p className='mx-3 mb-2'>
        <span className='text-red-500'>*</span> indicates required field
      </p>
      <hr className='border border-gray-300' />
      <div className='p-5'>
        <form onSubmit={handleFormSubmit}>
          <div className='grid lg:grid-cols-2 md:grid-cols-2 sm:grid-cols-1 gap-4'>
            {fields.map((f) => (
              <div key={f.name}>
                <label className='block mb-2 text-sm font-medium text-gray-900'>
                  {f.label} <span className='text-red-500'>*</span>
                </label>
                <TextField
                  size='small'
                  type={f.type}
                  name={f.name}
                  id={f.name}
                  fullWidth
                  placeholder={`Enter ${f.label}`}
                  required={f.name !== 'password' || !isEdit}
                  value={formValues[f.name]}
                  onChange={handleChange}
                />
              </div>
            ))}
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                User Type <span className='text-red-500'>*</span>
              </label>
              <Autocomplete
                disablePortal
                options={roleOptions}
                getOptionLabel={(o) => o.label}
                size='small'
                loading={loadingMeta}
                onChange={(_, v) => setFormValues((f) => ({ ...f, role: v?.id || '' }))}
                value={roleOptions.find((opt) => opt.id === formValues.role) || null}
                renderInput={(params) => <TextField {...params} label='Select User Type' required />}
              />
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                Select Department <span className='text-red-500'>*</span>
              </label>
              <Autocomplete
                disablePortal
                options={meta.departments}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                getOptionLabel={(o) => o.name}
                size='small'
                loading={loadingMeta}
                onChange={(_, v) => handleSelect('department', v)}
                value={meta.departments.find((opt) => opt.id === formValues.department) || null}
                renderInput={(params) => <TextField {...params} label='Select Department' />}
              />
            </div>
            <div>
              <label className='block mb-2 text-sm font-medium text-gray-900'>
                Select Plant <span className='text-red-500'>*</span>
              </label>
              <Autocomplete
                disablePortal
                options={meta.plants}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                getOptionLabel={(o) => o.name}
                size='small'
                loading={loadingMeta}
                onChange={(_, v) => handleSelect('plant', v)}
                value={meta.plants.find((opt) => opt.id === formValues.plant) || null}
                renderInput={(params) => <TextField {...params} label='Select Plant' />}
              />
            </div>
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
  );
}
