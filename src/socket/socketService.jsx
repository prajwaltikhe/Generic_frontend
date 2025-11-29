import { io } from 'socket.io-client';
import { updatedData } from '../redux/vehiclesSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;
let socket = null;

const connectSocket = (dispatch) => {
  if (!SOCKET_URL) return Promise.reject(Error('SOCKET_URL not defined'));
  if (socket?.connected) return Promise.resolve(socket);

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 2,
    reconnectionDelay: 1500,
    timeout: 2000,
    forceNew: true,
  });

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      disconnectSocket();
      reject(Error('Socket connection timed out'));
    }, 5000);

    socket.once('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.once('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    socket.on('reconnect_failed', disconnectSocket);

    socket.off('gpsData');
    socket.on('gpsData', (data) => dispatch(updatedData(data)));
  });
};

const disconnectSocket = () => {
  socket?.off('gpsData');
  socket?.disconnect();
  socket = null;
};

export { connectSocket, disconnectSocket, socket };
