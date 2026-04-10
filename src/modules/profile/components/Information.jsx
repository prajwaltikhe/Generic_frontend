import { useEffect, useMemo, useState } from 'react';
import { TextField } from '@mui/material';

export default function Information({ role, profile, loading, saving, onSave }) {
  const [form, setForm] = useState({
    employee_id: '',
    name: '',
    email: '',
    phone_number: '',
    department_name: '',
    plant_name: '',
    role_label: '',
  });

  useEffect(() => {
    setForm({
      employee_id: profile?.employee_id || '',
      name: profile?.name || '',
      email: profile?.email || '',
      phone_number: profile?.phone_number || '',
      department_name: profile?.department_name || '',
      plant_name: profile?.plant_name || '',
      role_label: profile?.role_label || '',
    });
  }, [profile]);

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin';
  const isReadOnly = !isSuperAdmin && !isAdmin;
  const canEditNameEmailPhone = isSuperAdmin || isAdmin;
  const canEditEmployeeId = isAdmin;
  const showAdminFixedFields = isAdmin;
  const showOperatorDisplayFields = !isSuperAdmin && !isAdmin;

  const disableSave = useMemo(() => {
    if (loading || saving || isReadOnly) return true;
    if (canEditEmployeeId && !form.employee_id.trim()) return true;
    if (!form.name.trim() || !form.email.trim()) return true;
    return !/^\d{10,15}$/.test(String(form.phone_number || '').replace(/\D/g, ''));
  }, [loading, saving, isReadOnly, canEditEmployeeId, form]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (disableSave) return;
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone_number: String(form.phone_number || '').replace(/\D/g, ''),
    };
    if (canEditEmployeeId) payload.employee_id = form.employee_id.trim();
    onSave?.(payload);
  };

  return (
    <form className='mt-3' onSubmit={submit}>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {(isAdmin || showOperatorDisplayFields) && (
          <TextField
            label='Employee ID'
            size='small'
            value={form.employee_id}
            onChange={(e) => setField('employee_id', e.target.value)}
            fullWidth
            disabled={!canEditEmployeeId}
          />
        )}
        <TextField
          label='Name'
          size='small'
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          fullWidth
          disabled={!canEditNameEmailPhone}
        />
        <TextField
          label='Email'
          size='small'
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          fullWidth
          disabled={!canEditNameEmailPhone}
        />
        <TextField
          label='Phone Number'
          size='small'
          value={form.phone_number}
          onChange={(e) => setField('phone_number', e.target.value)}
          fullWidth
          disabled={!canEditNameEmailPhone}
        />
        {(showAdminFixedFields || showOperatorDisplayFields) && (
          <>
            <TextField label='Department' size='small' value={form.department_name} fullWidth disabled />
            <TextField label='Plant' size='small' value={form.plant_name} fullWidth disabled />
            <TextField label='User Type' size='small' value={form.role_label} fullWidth disabled />
          </>
        )}
      </div>
      {!isReadOnly && (
        <button
          type='submit'
          disabled={disableSave}
          className='text-white bg-[#07163d] hover:bg-[#07163d] font-medium rounded-sm text-sm px-5 py-2.5 cursor-pointer mt-4 disabled:opacity-60 disabled:cursor-not-allowed'>
          {saving ? 'Updating...' : 'Update'}
        </button>
      )}
    </form>
  );
}
