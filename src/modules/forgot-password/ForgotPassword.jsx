import * as Yup from 'yup';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';
import { APIURL } from '../../constants';
import { AuthService, ApiService } from '../../services';
import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Paper,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const phoneSchema = Yup.object({
  phone_number: Yup.string()
    .required('Required')
    .test('digits', 'Enter 10–15 digits', (v) => /^\d{10,15}$/.test(String(v || '').replace(/\D/g, ''))),
  captchaAnswer: Yup.string()
    .required('Enter the captcha')
    .min(6, 'Captcha is 6 characters')
    .max(6, 'Captcha is 6 characters'),
});

const resetSchema = Yup.object({
  otp: Yup.string().required('Required').matches(/^\d{6}$/, '6-digit OTP'),
  newPassword: Yup.string().required('Required'),
  confirmPassword: Yup.string().required('Required'),
});

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

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('forgotPwdSession') || '');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [resendSec, setResendSec] = useState(0);
  const [resendBusy, setResendBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true);
    try {
      const json = await ApiService.getPublic(APIURL.CAPTCHA);
      const d = json?.data;
      if (d?.token && d?.imageBase64) {
        setCaptchaToken(d.token);
        setCaptchaImage(`data:${d.mimeType || 'image/png'};base64,${d.imageBase64}`);
      } else {
        toast.error('Could not load captcha');
        setCaptchaToken('');
        setCaptchaImage('');
      }
    } catch (e) {
      toast.error(e?.message || 'Could not load captcha');
      setCaptchaToken('');
      setCaptchaImage('');
    } finally {
      setCaptchaLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  useEffect(() => {
    if (resendSec <= 0) return undefined;
    const t = setInterval(() => setResendSec((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendSec]);

  const form1 = useFormik({
    initialValues: { phone_number: '', captchaAnswer: '' },
    validationSchema: phoneSchema,
    onSubmit: async (values, { setSubmitting, setFieldValue }) => {
      if (!captchaToken) {
        toast.error('Captcha not ready.');
        setSubmitting(false);
        return;
      }
      try {
        const res = await AuthService.requestForgotPasswordOtp(
          APIURL.FORGOT_PASSWORD_REQUEST,
          values.phone_number.replace(/\D/g, ''),
          captchaToken,
          values.captchaAnswer,
        );
        if (res?.success) {
          const sid = res?.data?.id;
          if (sid) {
            setSessionId(sid);
            localStorage.setItem('forgotPwdSession', sid);
            setStep(2);
            toast.success(res?.message || 'Check your mobile for OTP');
            setResendSec(RESEND_COOLDOWN_SEC);
          } else {
            toast.success(res?.message || 'If registered, you will receive an OTP.');
            setFieldValue('captchaAnswer', '');
            loadCaptcha();
          }
        } else {
          toast.error(res?.message || 'Request failed');
          setFieldValue('captchaAnswer', '');
          loadCaptcha();
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Request failed');
        setFieldValue('captchaAnswer', '');
        loadCaptcha();
      }
      setSubmitting(false);
    },
  });

  const form2 = useFormik({
    initialValues: { otp: '', newPassword: '', confirmPassword: '' },
    validationSchema: resetSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const sid = sessionId || localStorage.getItem('forgotPwdSession');
      if (!sid) {
        toast.error('Session expired. Start again.');
        setStep(1);
        setSubmitting(false);
        return;
      }
      const pe = validatePasswordPolicy(values.newPassword);
      if (pe) {
        toast.error(pe);
        setSubmitting(false);
        return;
      }
      if (values.newPassword !== values.confirmPassword) {
        toast.error('Passwords do not match');
        setSubmitting(false);
        return;
      }
      try {
        const res = await AuthService.completeForgotPassword(
          APIURL.FORGOT_PASSWORD_COMPLETE,
          sid,
          values.otp,
          values.newPassword,
          values.confirmPassword,
        );
        if (res?.success) {
          localStorage.removeItem('forgotPwdSession');
          toast.success(res?.message || 'Password updated');
          navigate('/login', { replace: true });
        } else {
          toast.error(res?.message || 'Failed');
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'Failed');
      }
      setSubmitting(false);
    },
  });

  const handleResend = async () => {
    const sid = sessionId || localStorage.getItem('forgotPwdSession');
    if (!sid) {
      toast.error('Session expired');
      setStep(1);
      return;
    }
    if (resendSec > 0 || resendBusy) return;
    setResendBusy(true);
    try {
      const json = await AuthService.resendForgotPasswordOtp(APIURL.FORGOT_PASSWORD_RESEND, sid);
      if (json?.success) {
        toast.success(json?.message || 'OTP sent again');
        setResendSec(RESEND_COOLDOWN_SEC);
      } else {
        toast.error(json?.message || 'Could not resend');
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'Could not resend');
    }
    setResendBusy(false);
  };

  return (
    <div className='bg-[#ecf0f5] w-full min-h-screen flex justify-center items-center py-8'>
      <div className='flex flex-col items-center'>
        <img src={logo} alt='samsung logo' className='w-32' />
        <Paper elevation={3} className='p-5 w-[420px] mt-3'>
          {step === 1 ? (
            <form onSubmit={form1.handleSubmit}>
              <Typography variant='body2' className='text-gray-600 mb-3'>
                Enter your registered mobile number. We will send an OTP to verify it&apos;s you.
              </Typography>
              <TextField
                name='phone_number'
                label='Mobile number'
                fullWidth
                size='small'
                margin='normal'
                value={form1.values.phone_number}
                onChange={form1.handleChange}
                disabled={form1.isSubmitting}
                error={form1.touched.phone_number && Boolean(form1.errors.phone_number)}
                helperText={form1.touched.phone_number && form1.errors.phone_number}
              />
              <Box className='w-full mt-2'>
                <Typography variant='caption' className='text-gray-600 block mb-1'>
                  Security check (case-sensitive, 6 characters)
                </Typography>
                <div className='flex items-center gap-2 w-full'>
                  <Box
                    className='flex-1 rounded border border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center'
                    sx={{ minHeight: 56, maxHeight: 72 }}>
                    {captchaLoading ? (
                      <CircularProgress size={28} />
                    ) : captchaImage ? (
                      <img
                        src={captchaImage}
                        alt='Captcha'
                        className='max-h-[68px] w-auto object-contain select-none'
                        draggable={false}
                      />
                    ) : (
                      <Typography variant='caption' color='text.secondary'>
                        Unavailable
                      </Typography>
                    )}
                  </Box>
                  <IconButton
                    type='button'
                    onClick={() => {
                      form1.setFieldValue('captchaAnswer', '');
                      loadCaptcha();
                    }}
                    disabled={captchaLoading || form1.isSubmitting}
                    size='small'
                    className='border border-gray-300 rounded'>
                    <RefreshIcon fontSize='small' />
                  </IconButton>
                </div>
                <TextField
                  name='captchaAnswer'
                  label='Enter characters shown'
                  fullWidth
                  size='small'
                  margin='dense'
                  disabled={form1.isSubmitting || captchaLoading || !captchaToken}
                  value={form1.values.captchaAnswer}
                  onChange={form1.handleChange}
                  error={form1.touched.captchaAnswer && Boolean(form1.errors.captchaAnswer)}
                  helperText={form1.touched.captchaAnswer && form1.errors.captchaAnswer}
                  inputProps={{ maxLength: 6, spellCheck: false }}
                />
              </Box>
              <div className='flex justify-end mt-3 gap-2'>
                <Button component={Link} to='/login' size='small'>
                  Back to login
                </Button>
                <Button type='submit' variant='contained' disabled={form1.isSubmitting} sx={{ textTransform: 'none' }}>
                  {form1.isSubmitting ? 'Sending…' : 'Send OTP'}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={form2.handleSubmit}>
              <Typography variant='body2' className='text-gray-600 mb-3'>
                Enter the OTP sent to your mobile, then choose a new password.
              </Typography>
              <TextField
                name='otp'
                label='OTP'
                fullWidth
                size='small'
                margin='normal'
                value={form2.values.otp}
                onChange={form2.handleChange}
                disabled={form2.isSubmitting}
                error={form2.touched.otp && Boolean(form2.errors.otp)}
                helperText={form2.touched.otp && form2.errors.otp}
                inputProps={{ inputMode: 'numeric', maxLength: 6 }}
              />
              <TextField
                name='newPassword'
                label='New password'
                type={showPw ? 'text' : 'password'}
                fullWidth
                size='small'
                margin='normal'
                value={form2.values.newPassword}
                onChange={form2.handleChange}
                disabled={form2.isSubmitting}
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
                name='confirmPassword'
                label='Confirm password'
                type={showPw2 ? 'text' : 'password'}
                fullWidth
                size='small'
                margin='normal'
                value={form2.values.confirmPassword}
                onChange={form2.handleChange}
                disabled={form2.isSubmitting}
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
              <div className='mt-2 flex flex-col items-center gap-1'>
                <Button
                  type='button'
                  variant='text'
                  size='small'
                  disabled={resendBusy || resendSec > 0 || form2.isSubmitting}
                  onClick={handleResend}
                  sx={{ textTransform: 'none' }}>
                  {resendBusy ? 'Sending…' : 'Resend OTP'}
                </Button>
                {resendSec > 0 ? (
                  <Typography variant='caption' color='text.secondary'>
                    Resend available in {resendSec}s
                  </Typography>
                ) : null}
              </div>
              <div className='flex justify-end mt-3 gap-2'>
                <Button
                  type='button'
                  size='small'
                  onClick={() => {
                    setStep(1);
                    localStorage.removeItem('forgotPwdSession');
                    setSessionId('');
                  }}>
                  Back
                </Button>
                <Button type='submit' variant='contained' disabled={form2.isSubmitting} sx={{ textTransform: 'none' }}>
                  {form2.isSubmitting ? 'Saving…' : 'Update password'}
                </Button>
              </div>
            </form>
          )}
        </Paper>
      </div>
    </div>
  );
}
