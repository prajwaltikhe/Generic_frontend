function authMiddleware(response) {
  if (response.status === 401) {
    alert('Session expired. Please log in again.');
    localStorage.removeItem('authToken');
    window.location.replace('/');
    return true;
  }
  return false;
}

export default authMiddleware;
