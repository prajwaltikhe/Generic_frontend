import { lazy, Suspense } from 'react';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import CircularProgress from '@mui/material/CircularProgress';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const Login = lazy(() => import('./modules/login/Login'));
const Otp = lazy(() => import('./modules/otp/Otp'));
const Layout = lazy(() => import('./components/layout/Layout'));
const DynamicRoute = lazy(() => import('./routes/DynamicRoute'));

const LoadingScreen = () => (
  <div
    className='fixed inset-0 z-[100000] flex flex-col items-center justify-center'
    style={{ background: 'linear-gradient(120deg, #e3ebff 0%, #f5f7fa 100%)' }}>
    <CircularProgress size={44} sx={{ color: 'rgb(59,130,246)' }} thickness={4} />
    <div className='mt-5 flex text-blue-700 text-2xl font-semibold'>
      Loading
      <span className='animate-bounce ml-1'>...</span>
    </div>
    <style>{`
      @keyframes bounce { 0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);} }
      .animate-bounce { display:inline-block; animation:bounce 1s infinite; }
    `}</style>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <ToastContainer />
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/otp' element={<Otp />} />
            <Route path='/' element={<Layout />}>
              <Route path='*' element={<DynamicRoute />} />
            </Route>
            <Route path='*' element={<div>404</div>} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
