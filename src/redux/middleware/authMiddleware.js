import { toast } from 'react-toastify';

function authMiddleware(response) {
  if (response.status === 401) {
    localStorage.clear();
    window.location.replace('/login');
    toast.error('Session expired. Please log in again.');
    return true;
  }
  return false;
}

export default authMiddleware;
