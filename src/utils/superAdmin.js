import { jwtDecode } from 'jwt-decode';

/**
 * Matches backend SUPER_ADMIN_ROLES (comma-separated, case-insensitive).
 */
export function isSuperAdminFromToken(token) {
  if (!token) return false;
  try {
    const d = jwtDecode(token);
    const role = (d.role ?? '').toString().trim().toLowerCase();
    if (!role) return false;
    const envList = (import.meta.env.VITE_SUPER_ADMIN_ROLES || 'super admin,superadmin')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const norm = role.replace(/\s+/g, '');
    return envList.some((a) => role === a || norm === a.replace(/\s+/g, ''));
  } catch {
    return false;
  }
}

export function isSuperAdminFromStorage() {
  return isSuperAdminFromToken(localStorage.getItem('authToken'));
}
