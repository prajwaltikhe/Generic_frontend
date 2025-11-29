import authMiddleware from '../redux/middleware/authMiddleware';

const buildUrl = (baseUrl, params) => {
  const query = params && Object.keys(params).length ? '?' + new URLSearchParams(params) : '';
  return import.meta.env.VITE_BASE_URL + baseUrl + query;
};

const getToken = () => localStorage.getItem('authToken');
const jsonHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

const fetchJson = async (url, options) => {
  const res = await fetch(url, options);
  if (!res.headers.get('content-type')?.includes('application/json')) {
    const text = await res.text();
    console.error('Non-JSON response received:', text.slice(0, 200));
    throw new Error(`Server returned non-JSON response. Status: ${res.status}`);
  }
  return res.json();
};

export default {
  post: async (url, data, params = {}) =>
    fetchJson(await buildUrl(url, params), {
      method: 'POST',
      headers: jsonHeaders(getToken()),
      body: JSON.stringify(data),
    }),

  postFormData: async (url, formData, params = {}) => {
    const base = import.meta.env.VITE_UPLOAD_URL;
    const query = params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return fetchJson(base + url + query, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
  },

  get: async (url, params = {}) => {
    const res = await fetch(await buildUrl(url, params), {
      method: 'GET',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.headers.get('content-type')?.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response received:', text.slice(0, 200));
      throw new Error(`Server returned non-JSON response. Status: ${res.status}`);
    }
    if (authMiddleware(res)) return;
    return res.json();
  },

  put: async (url, data, params = {}) =>
    fetchJson(await buildUrl(url, params), {
      method: 'PUT',
      headers: jsonHeaders(getToken()),
      body: JSON.stringify(data),
    }),

  delete: async (url, data, params = {}) =>
    fetchJson(await buildUrl(url, params), {
      method: 'DELETE',
      headers: jsonHeaders(getToken()),
      body: JSON.stringify(data),
    }),
};
