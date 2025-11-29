import { jwtDecode } from 'jwt-decode';
import ApiService from './ApiService';

const setToken = (token) => token && localStorage.setItem('authToken', token);
const getToken = () => localStorage.getItem('authToken');
const removeToken = () => localStorage.removeItem('authToken');
const isTokenValid = (token) => {
  try {
    const { exp } = jwtDecode(token);
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const AuthService = {
  login: async (url, email, password) => {
    const data = await ApiService.post(url, { email, password });
    setToken(data?.data?.token);
    return data;
  },

  verifyOtp: async (url, userId, otp) => {
    const data = await ApiService.post(url, { userId, otp });
    setToken(data?.data?.token);
    return data;
  },

  logout: removeToken,
  getToken,
  isAuthenticated: () => {
    const token = getToken();
    return !!token && isTokenValid(token);
  },
  getUser: () => {
    const token = getToken();
    try {
      return token ? jwtDecode(token) : null;
    } catch {
      return null;
    }
  },
};

export default AuthService;
