import authMiddleware from '../redux/middleware/authMiddleware';

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BASE_URL ||
  'http://localhost:8080/api/v1'
).replace(/\/+$/, '');

const withLeadingSlash = (path) => (path.startsWith('/') ? path : `/${path}`);

const buildUrl = (baseUrl, params) => {
  const query = params && Object.keys(params).length ? '?' + new URLSearchParams(params) : '';
  return API_BASE + withLeadingSlash(baseUrl) + query;
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
  getPublic: async (url, params = {}) => {
    const res = await fetch(await buildUrl(url, params), {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(text.slice(0, 200) || `HTTP ${res.status}`);
    }
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `Failed to load (${res.status})`);
    }
    return json;
  },

  postPublic: async (url, data = {}, params = {}) => {
    const res = await fetch(await buildUrl(url, params), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const contentType = res.headers.get('content-type') || '';
    let json;
    if (contentType.includes('application/json')) {
      json = await res.json();
    } else {
      const text = await res.text();
      throw { response: { data: { message: text.slice(0, 200) || `HTTP ${res.status}` } } };
    }
    if (!res.ok) {
      const msg =
        json.message ||
        (Array.isArray(json.errors) && json.errors[0]?.msg) ||
        json.error ||
        `Request failed (${res.status})`;
      throw { response: { data: { message: msg } } };
    }
    return json;
  },

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

  patch: async (url, data, params = {}) =>
    fetchJson(await buildUrl(url, params), {
      method: 'PATCH',
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
