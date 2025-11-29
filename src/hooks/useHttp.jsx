import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const API_BASE_PATH = 'http://localhost:8080/api/v1';

const useHttp = () => {
  const { token } = useAuth();
  const request = useCallback(
    async ({ url, method = 'GET', body = null, headers = {}, showSuccessToast = false }) => {
      try {
        headers = { ...headers, 'Content-Type': 'application/json' };
        const configHeaders = new Headers(headers);
        if (token) configHeaders.append('Authorization', `Bearer ${token}`);

        const response = await fetch(API_BASE_PATH + url, {
          method,
          body: body ? JSON.stringify(body) : null,
          headers: configHeaders,
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.message);
          throw new Error(errorData.message);
        }
        if (showSuccessToast) toast.success('Operation successful');

        return response;
      } catch (error) {
        console.error('HTTP request failed:', error);
        throw error;
      }
    },
    [token]
  );

  return { request };
};

export default useHttp;
