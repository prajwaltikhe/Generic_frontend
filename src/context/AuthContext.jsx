import { toast } from 'react-toastify';
import { jwtDecode as decode } from 'jwt-decode';
import { createContext, useContext, useState, useEffect, useRef } from 'react';

const TOKEN_KEY_NAME = 'authToken';
const REFRESH_TOKEN_KEY_NAME = 'refresh_token';

const defaultAuthContext = {
  token: null,
  role: null,
  isAuthenticated: false,
  user: null,
  id: null,
  login: () => {},
  logout: () => {},
};

const AuthContext = createContext(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY_NAME));
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem(TOKEN_KEY_NAME) !== null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [id, setId] = useState(null);
  const timeoutIdRef = useRef(null);

  const login = (token, refreshToken) => {
    setIsAuthenticated(true);
    setToken(token);
    try {
      const decodedToken = decode(token);
      if (decodedToken?.userId && decodedToken?.company_id) {
        setUser(decodedToken.userId);
        setId(decodedToken.company_id);
      } else {
        console.warn('Token decoded but missing required fields');
      }
    } catch (error) {
      toast.error(error?.toString());
      console.error('Failed to decode token', error);
      setUser(null);
    }
    localStorage.setItem(TOKEN_KEY_NAME, token);
    localStorage.setItem(REFRESH_TOKEN_KEY_NAME, refreshToken);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setToken(null);
    setUser(null);
    setId(null);
    setRole(null);
    localStorage.removeItem(TOKEN_KEY_NAME);
    localStorage.removeItem(REFRESH_TOKEN_KEY_NAME);
    if (timeoutIdRef.current !== null) clearTimeout(timeoutIdRef.current);
  };

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = decode(token);
        if (decodedToken?.user_id && decodedToken?.company_id) {
          setUser(decodedToken.user_id);
          setId(decodedToken.company_id);
        } else {
          console.warn('Token decoded but missing required fields');
        }
      } catch (error) {
        console.error('Failed to decode token on page load', error);
        logout();
      }
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, role, login, logout, token, id }}>
      {children}
    </AuthContext.Provider>
  );
};
