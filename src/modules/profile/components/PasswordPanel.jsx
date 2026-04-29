import { useState, useEffect, useCallback } from 'react';
import { TextField, Button, InputAdornment, IconButton, Typography, Box, Stack } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { toast } from 'react-toastify';
import ApiService from '../../../services/ApiService';
import { APIURL } from '../../../constants';

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

const RESEND_COOLDOWN_SEC = 60;

const primaryBtnSx = {
  textTransform: 'none',
  minHeight: 42,
  fontWeight: 600,
  bgcolor: '#07163d',
  '&:hover': { bgcolor: '#0a1f52' },
};

const secondaryBtnSx = {
  textTransform: 'none',
  minHeight: 42,
  fontWeight: 600,
  borderColor: '#07163d',
  color: '#07163d',
  '&:hover': { borderColor: '#0a1f52', bgcolor: 'rgba(7, 22, 61, 0.04)' },
};

export default function PasswordPanel({ variant = 'otp', saving, onSave }) {
  const isSuperAdmin = variant === 'superadmin';
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    otp: '',
  });
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendSec, setResendSec] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (resendSec <= 0) return undefined;
    const t = setInterval(() => setResendSec((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  const sendOtp = async () => {
    if (!form.newPassword.trim()) {
      toast.error('Enter new password first');
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
    try {
      const res = await ApiService.post(APIURL.PORTAL_PASSWORD_RESET_REQUEST_OTP, {});
      if (res?.success && res?.data?.id) {
        setOtpSessionId(res.data.id);
        setOtpSent(true);
        setResendSec(RESEND_COOLDOWN_SEC);
        setField('otp', '');
        toast.success(res?.message || 'OTP sent');
      } else {
        toast.error(res?.message || 'Could not send OTP');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not send OTP');
    }
  };

  const handleResend = useCallback(async () => {
    if (!otpSessionId || resendSec > 0 || resendBusy) return;
    setResendBusy(true);
    try {
      const res = await ApiService.post(APIURL.PORTAL_PASSWORD_RESET_RESEND, { userId: otpSessionId });
      if (res?.success) {
        toast.success(res?.message || 'OTP sent again');
        setResendSec(RESEND_COOLDOWN_SEC);
      } else {
        toast.error(res?.message || 'Could not resend');
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Could not resend');
    }
    setResendBusy(false);
  }, [otpSessionId, resendBusy, resendSec]);

  const submitSuperAdmin = (e) => {
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
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    const passwordErr = validatePasswordPolicy(form.newPassword);
    if (passwordErr) {
      toast.error(passwordErr);
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New and confirm password do not match');
      return;
    }
    if (!/^\d{6}$/.test(String(form.otp || ''))) {
      toast.error('Enter the 6-digit OTP');
      return;
    }
    if (!otpSessionId) {
      toast.error('Request an OTP first');
      return;
    }
    try {
      const res = await ApiService.post(APIURL.PORTAL_PASSWORD_RESET_COMPLETE, {
        userId: otpSessionId,
        otp: form.otp,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      if (res?.success) {
        toast.success(res?.message || 'Password updated');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '', otp: '' });
        setOtpSessionId('');
        setOtpSent(false);
      } else {
        toast.error(res?.message || 'Update failed');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Update failed');
    }
  };

  if (isSuperAdmin) {
    return (
      <form className='mt-4' onSubmit={submitSuperAdmin}>
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

  const fieldGap = { mb: 2.5 };

  return (
    <Box className='mt-4 max-w-md'>
      {!otpSent ? (
        <>
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mb: 4, lineHeight: 1.6, display: 'block' }}>
            Enter your new password and confirmation below, then tap <strong>Send OTP</strong>. We will text a
            verification code to your registered mobile number.
          </Typography>
          <Stack spacing={0} component='div'>
            <TextField
              label='New password'
              type={showPw ? 'text' : 'password'}
              value={form.newPassword}
              onChange={(e) => setField('newPassword', e.target.value)}
              fullWidth
              size='small'
              variant='outlined'
              sx={fieldGap}
              InputLabelProps={{ shrink: Boolean(form.newPassword) }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton size='small' onClick={() => setShowPw((v) => !v)} edge='end' tabIndex={-1}>
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label='Confirm password'
              type={showPw2 ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              fullWidth
              size='small'
              variant='outlined'
              sx={{ mb: 3 }}
              InputLabelProps={{ shrink: Boolean(form.confirmPassword) }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton size='small' onClick={() => setShowPw2((v) => !v)} edge='end' tabIndex={-1}>
                      {showPw2 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type='button'
              variant='outlined'
              fullWidth
              onClick={sendOtp}
              sx={secondaryBtnSx}>
              Send OTP
            </Button>
          </Stack>
        </>
      ) : (
        <>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 4, lineHeight: 1.6, display: 'block' }}>
            Enter the 6-digit code we texted you, then tap <strong>Update password</strong>. Wrong number or need to
            change passwords?{' '}
            <Button
              type='button'
              variant='text'
              size='small'
              onClick={() => {
                setOtpSent(false);
                setOtpSessionId('');
                setField('otp', '');
              }}
              sx={{ textTransform: 'none', p: 0, minWidth: 0, verticalAlign: 'baseline', fontSize: 'inherit' }}>
              Start over
            </Button>
          </Typography>
          <form onSubmit={submitOtp}>
            <TextField
              label='OTP'
              value={form.otp}
              onChange={(e) => setField('otp', e.target.value.replace(/\D/g, '').slice(0, 6))}
              fullWidth
              size='small'
              variant='outlined'
              sx={{ mb: 2 }}
              autoComplete='one-time-code'
              inputProps={{ inputMode: 'numeric' }}
            />
            <Stack direction='row' alignItems='center' spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
              <Button
                type='button'
                variant='text'
                disabled={resendBusy || resendSec > 0}
                onClick={handleResend}
                sx={{ textTransform: 'none' }}>
                {resendBusy ? 'Sending…' : 'Resend OTP'}
              </Button>
              {resendSec > 0 ? (
                <Typography variant='caption' color='text.secondary'>
                  Resend in {resendSec}s
                </Typography>
              ) : null}
            </Stack>
            <Button type='submit' variant='contained' fullWidth disableElevation sx={primaryBtnSx}>
              Update password
            </Button>
          </form>
        </>
      )}
    </Box>
  );
}
