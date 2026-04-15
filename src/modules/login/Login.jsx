import * as Yup from 'yup';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';
import { APIURL } from '../../constants';
import { AuthService, ApiService } from '../../services';
import { Link, useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Https';
import EmailIcon from '@mui/icons-material/Email';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useCallback, useEffect, useState } from 'react';
import {
  Paper,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  InputAdornment,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
  captchaAnswer: Yup.string()
    .required('Enter the captcha')
    .min(6, 'Captcha is 6 characters')
    .max(6, 'Captcha is 6 characters'),
});

function Login() {
  const navigate = useNavigate();
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(true);

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

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  const formik = useFormik({
    initialValues: {
      email: localStorage.getItem('rememberedEmail') || '',
      password: '',
      captchaAnswer: '',
      rememberMe: !!localStorage.getItem('rememberedEmail'),
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, setFieldValue }) => {
      if (!captchaToken) {
        toast.error('Captcha not ready. Please wait or refresh the code.');
        setSubmitting(false);
        return;
      }
      try {
        const res = await AuthService.login(
          APIURL.LOGIN,
          values.email,
          values.password,
          captchaToken,
          values.captchaAnswer,
        );
        if (res?.success) {
          values.rememberMe
            ? localStorage.setItem('rememberedEmail', values.email)
            : localStorage.removeItem('rememberedEmail');
          localStorage.setItem('pendingUserEmail', values.email);
          localStorage.setItem('user_id', res.data?.id);
          toast.success('Login successful! Please enter your OTP.');
          navigate('/otp');
        } else {
          toast.error(res?.message || 'Login failed');
          setFieldValue('captchaAnswer', '');
          loadCaptcha();
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Invalid Login Credentials');
        setFieldValue('captchaAnswer', '');
        loadCaptcha();
      }
      setSubmitting(false);
    },
  });

  return (
    <div className='bg-[#ecf0f5] w-full h-screen flex justify-center items-center'>
      <div className='flex flex-col items-center'>
        <img src={logo} alt='samsung logo' className='w-32' />
        <Paper elevation={3} className='p-5 w-[420px] mt-3'>
          <form onSubmit={formik.handleSubmit} className='flex flex-col items-center w-full'>
            <h1 className='text-sm text-gray-600 mb-2'>Sign in to start your session</h1>
            <TextField
              id='email'
              name='email'
              type='email'
              label='Email'
              placeholder='Email'
              autoComplete='email'
              fullWidth
              size='small'
              margin='normal'
              disabled={formik.isSubmitting}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <EmailIcon fontSize='small' />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              id='password'
              name='password'
              type='password'
              label='Password'
              placeholder='Password'
              autoComplete='current-password'
              fullWidth
              size='small'
              margin='normal'
              disabled={formik.isSubmitting}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <LockIcon fontSize='small' />
                  </InputAdornment>
                ),
              }}
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
                      style={{ imageRendering: 'auto' }}
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
                  aria-label='New captcha'
                  onClick={() => {
                    formik.setFieldValue('captchaAnswer', '');
                    loadCaptcha();
                  }}
                  disabled={captchaLoading || formik.isSubmitting}
                  size='small'
                  className='border border-gray-300 rounded'>
                  <RefreshIcon fontSize='small' />
                </IconButton>
              </div>
              <TextField
                id='captchaAnswer'
                name='captchaAnswer'
                label='Enter characters shown'
                placeholder='6 characters'
                fullWidth
                size='small'
                margin='dense'
                autoComplete='off'
                disabled={formik.isSubmitting || captchaLoading || !captchaToken}
                value={formik.values.captchaAnswer}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.captchaAnswer && Boolean(formik.errors.captchaAnswer)}
                helperText={
                  (formik.touched.captchaAnswer && formik.errors.captchaAnswer) ||
                  'Match upper/lowercase exactly as shown'
                }
                inputProps={{ maxLength: 6, spellCheck: false, autoCapitalize: 'off' }}
              />
            </Box>
            <div className='flex justify-between items-center w-full mt-2'>
              <FormControlLabel
                control={
                  <Checkbox
                    id='rememberMe'
                    name='rememberMe'
                    checked={formik.values.rememberMe}
                    onChange={formik.handleChange}
                    disabled={formik.isSubmitting}
                    size='small'
                  />
                }
                label='Remember me'
                className='text-sm text-gray-600'
              />
              <Button
                type='submit'
                variant='contained'
                color='primary'
                className='rounded-md transition'
                disabled={formik.isSubmitting}
                sx={{
                  py: 1,
                  px: 3,
                  textTransform: 'none',
                  bgcolor: 'rgb(59 130 246)',
                  '&:hover': { bgcolor: 'rgb(37 99 235)' },
                  ...(formik.isSubmitting && { opacity: 0.6, cursor: 'not-allowed' }),
                }}>
                {formik.isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </div>
            <div className='mt-2 w-full text-right'>
              <a href='#' className='text-sm text-blue-500 hover:text-gray-800'>
                Forgot your password?
              </a>
            </div>
            <div className='mt-4 w-full text-center text-sm text-gray-600'>
              <Link to='/terms-of-service' className='text-blue-600 hover:text-blue-800 hover:underline'>
                Terms of Service
              </Link>
            </div>
          </form>
        </Paper>
      </div>
    </div>
  );
}

export default Login;
