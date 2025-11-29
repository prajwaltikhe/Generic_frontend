import { useEffect } from 'react';
import Sidebar from '../sidebar/Sidebar';
import { useDispatch } from 'react-redux';
import { Outlet, useLocation } from 'react-router-dom';
import { connectSocket, disconnectSocket } from '../../socket/socketService';

function Layout() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    if (token && (pathname.includes('dashboard') || pathname.includes('multitrack'))) {
      connectSocket(dispatch);
      return disconnectSocket;
    }
    return disconnectSocket;
  }, [dispatch, token, pathname]);

  return (
    <div className='flex h-screen bg-[#ecf0f5]'>
      <Sidebar />
      <main className='flex-1'>
        <div className='overflow-y-auto h-screen box-border w-[calc(100vw-95px)] transition-all duration-300 p-2'>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
