import * as Yup from 'yup';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';
import { APIURL } from '../../constants';
import { AuthService } from '../../services';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Https';
import EmailIcon from '@mui/icons-material/Email';
import { Paper, TextField, Checkbox, FormControlLabel, Button, InputAdornment } from '@mui/material';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
});

function Login() {
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      email: localStorage.getItem('rememberedEmail') || '',
      password: '',
      rememberMe: !!localStorage.getItem('rememberedEmail'),
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await AuthService.login(APIURL.LOGIN, values.email, values.password);
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
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Invalid Login Credentials');
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
          </form>
        </Paper>
      </div>
    </div>
  );
}

export default Login;
