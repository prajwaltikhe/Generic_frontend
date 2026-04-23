import { jwtDecode } from 'jwt-decode';

/** Portal JWT (Firebase ID token) stored after OTP — must have exp claim */
export function isPortalTokenValid() {
  const t = localStorage.getItem('authToken');
  if (!t) return false;
  try {
    const { exp } = jwtDecode(t);
    if (exp == null) return false;
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function clearInvalidPortalSession() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('company_id');
}
