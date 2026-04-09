import { jwtDecode } from 'jwt-decode';

export const ROLE = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  DISPLAY: 'display',
};

export function normalizeRole(role) {
  return String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function getRoleFromToken(token) {
  if (!token) return '';
  try {
    const decoded = jwtDecode(token);
    return normalizeRole(decoded?.role);
  } catch {
    return '';
  }
}

export function getRoleFromStorage() {
  return getRoleFromToken(localStorage.getItem('authToken'));
}

export function canManageUsers(role) {
  const r = normalizeRole(role);
  return r === ROLE.SUPERADMIN || r === ROLE.ADMIN;
}

export function canAccessEmailSmsConfig(role) {
  return normalizeRole(role) === ROLE.SUPERADMIN;
}

export function canAccessIpWhitelisting(role) {
  return normalizeRole(role) === ROLE.SUPERADMIN;
}

export function canAccessSettings(role) {
  const r = normalizeRole(role);
  return r === ROLE.SUPERADMIN || r === ROLE.ADMIN;
}

export function canAccessManagement(role) {
  const r = normalizeRole(role);
  return r === ROLE.SUPERADMIN || r === ROLE.ADMIN;
}

export function canAccessMaster(role) {
  const r = normalizeRole(role);
  return r === ROLE.SUPERADMIN || r === ROLE.ADMIN;
}

export function canAccessReports(role) {
  const r = normalizeRole(role);
  return [ROLE.SUPERADMIN, ROLE.ADMIN, ROLE.OPERATOR].includes(r);
}

export function canAccessMultitrack(role) {
  const r = normalizeRole(role);
  return [ROLE.SUPERADMIN, ROLE.ADMIN, ROLE.OPERATOR].includes(r);
}

export function canAccessDashboard(role) {
  return [ROLE.SUPERADMIN, ROLE.ADMIN, ROLE.OPERATOR, ROLE.DISPLAY].includes(normalizeRole(role));
}
