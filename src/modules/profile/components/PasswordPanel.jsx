import { useState } from 'react';
import { TextField } from '@mui/material';
import { toast } from 'react-toastify';

export default function PasswordPanel({ saving, onSave }) {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.newPassword.trim()) {
      toast.error('New password is required');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New and confirm password do not match');
      return;
    }
    onSave?.(form.newPassword);
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <form className='mt-4' onSubmit={submit}>
      {['Current', 'New', 'Confirm'].map((label, i) => (
        <TextField
          key={label}
          label={`${label} Password`}
          name={label === 'Current' ? 'currentPassword' : label === 'New' ? 'newPassword' : 'confirmPassword'}
          type='password'
          value={
            label === 'Current' ? form.currentPassword : label === 'New' ? form.newPassword : form.confirmPassword
          }
          onChange={(e) =>
            setField(
              label === 'Current' ? 'currentPassword' : label === 'New' ? 'newPassword' : 'confirmPassword',
              e.target.value
            )
          }
          fullWidth
          size='small'
          variant='outlined'
          disabled={saving}
          sx={i < 2 ? { mb: 3 } : undefined}
        />
      ))}
      <button
        type='submit'
        disabled={saving}
        className='text-white bg-[#07163d] hover:bg-[#07163d] font-medium rounded-sm text-sm px-5 py-2.5 cursor-pointer mt-4 disabled:opacity-60 disabled:cursor-not-allowed'>
        {saving ? 'Updating...' : 'Update'}
      </button>
    </form>
  );
}
