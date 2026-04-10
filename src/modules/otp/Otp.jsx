import * as Yup from 'yup';
import { useState } from 'react';
import { useFormik } from 'formik';
import { toast } from 'react-toastify';
import logo from '../../assets/logo.png';
import { useDispatch } from 'react-redux';
import { auth } from '../../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { verifyOtp } from '../../redux/authSlice';
import { useAuth } from '../../context/AuthContext';
import { signInWithCustomToken } from 'firebase/auth';
import { fetchPlants } from '../../redux/plantSlice';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { fetchDepartments } from '../../redux/departmentSlice';
import { IconButton, Paper, TextField, Button, InputAdornment } from '@mui/material';

const validationSchema = Yup.object({
  otp: Yup.string()
    .required('OTP is required')
    .matches(/^\d{6}$/, 'Enter 6-digit OTP'),
});

function Otp() {
  const { login } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showOtp, setShowOtp] = useState(false);

  const formik = useFormik({
    initialValues: { otp: '' },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        toast.error('Session expired');
        navigate('/');
        setSubmitting(false);
        return;
      }
      try {
        const actionResult = await dispatch(verifyOtp({ userId, otp: values.otp }));
        if (verifyOtp.fulfilled.match(actionResult)) {
          const { token, user } = actionResult.payload;
          const cred = await signInWithCustomToken(auth, token);
          const idToken = await cred.user.getIdToken();

          login(idToken); // Context login
          localStorage.setItem('company_id', user.company_id);
          localStorage.removeItem('user_id');
          localStorage.removeItem('pendingUserEmail');
          toast.success('OTP verified');
          navigate('/dashboard');

          // Load initial data in background (after navigation)
          dispatch(fetchDepartments({ limit: 10 }));
          dispatch(fetchPlants({ limit: 50 }));
        } else {
          toast.error(actionResult.payload || 'Invalid OTP');
        }
      } catch {
        toast.error('Verification failed');
      }
      setSubmitting(false);
    },
  });

  return (
    <div className='bg-[#ecf0f5] w-full h-screen flex justify-center items-center'>
      <div className='flex flex-col items-center'>
        <img src={logo} alt='samsung logo' className='w-40' />
        <Paper elevation={3} className='p-5 w-[420px] mt-3'>
          <h1 className='text-sm text-gray-600 mb-4'>OTP</h1>
          <form className='w-full' onSubmit={formik.handleSubmit}>
            <div className='mb-4'>
              <TextField
                id='otp'
                name='otp'
                type={showOtp ? 'text' : 'password'}
                label='Enter OTP'
                placeholder='Enter OTP'
                value={formik.values.otp}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                fullWidth
                size='small'
                required
                disabled={formik.isSubmitting}
                error={formik.touched.otp && Boolean(formik.errors.otp)}
                helperText={formik.touched.otp && formik.errors.otp}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        onClick={() => setShowOtp((v) => !v)}
                        size='small'
                        tabIndex={-1}
                        disabled={formik.isSubmitting}
                        edge='end'>
                        {showOtp ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            <Button
              type='submit'
              variant='contained'
              color='primary'
              fullWidth
              disabled={formik.isSubmitting}
              sx={{
                py: 1.2,
                textTransform: 'none',
                bgcolor: 'rgb(59 130 246)',
                '&:hover': { bgcolor: 'rgb(37 99 235)' },
                ...(formik.isSubmitting && { opacity: 0.6, cursor: 'not-allowed' }),
              }}>
              {formik.isSubmitting ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </form>
        </Paper>
      </div>
    </div>
  );
}

export default Otp;
