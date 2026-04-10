import { useState } from 'react';
import { TextField } from '@mui/material';
import { toast } from 'react-toastify';

function validatePasswordPolicy(password) {
  const p = String(password || '');
  if (!p) return 'Password is required';
  if (/\s/.test(p)) return 'Password cannot contain spaces';
  if (p.length < 10) return 'Password must be at least 10 characters';
  if (!/[A-Z]/.test(p)) return 'Password must include at least one uppercase letter';
  if (!/[a-z]/.test(p)) return 'Password must include at least one lowercase letter';
  if (!/\d/.test(p)) return 'Password must include at least one digit';
  if (!/[!@#$*]/.test(p)) return 'Password must include at least one special character (!,@,#,$,*)';
  if (/[^A-Za-z0-9!@#$*]/.test(p)) return 'Only !,@,#,$,* are allowed as special characters';
  const blocked = ['samsung@123', 'admin', 'administrator', 'root', 'password', '123456'];
  if (blocked.includes(p.toLowerCase())) return 'This password is not allowed';
  for (let i = 0; i <= p.length - 3; i++) {
    const a = p.charCodeAt(i);
    const b = p.charCodeAt(i + 1);
    const c = p.charCodeAt(i + 2);
    const c1 = p[i];
    const c2 = p[i + 1];
    const c3 = p[i + 2];
    const allDigits = /\d/.test(c1) && /\d/.test(c2) && /\d/.test(c3);
    const allLetters = /[A-Za-z]/.test(c1) && /[A-Za-z]/.test(c2) && /[A-Za-z]/.test(c3);
    if (c1 === c2 && c2 === c3) return 'Password cannot contain repeated sequence like 111 or aaa';
    if ((allDigits || allLetters) && ((b - a === 1 && c - b === 1) || (a - b === 1 && b - c === 1))) {
      return 'Password cannot contain sequences like 123, 321, abc';
    }
  }
  return null;
}

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
    const passwordErr = validatePasswordPolicy(form.newPassword);
    if (passwordErr) {
      toast.error(passwordErr);
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
