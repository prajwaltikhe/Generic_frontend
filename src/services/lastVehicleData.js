const INFLUXDB_URL = import.meta.env.VITE_INFLUXDB_URL;

const buildUrl = (base, params = {}) => {
  const q = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
  return INFLUXDB_URL + base + q;
};

export default {
  get: async (url, params = {}) =>
    fetch(buildUrl(url, params), { method: 'GET', headers: { 'Content-Type': 'application/json' } }).then((r) =>
      r.json()
    ),

  post: async (url, data = {}, params = {}) =>
    fetch(buildUrl(url, params), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
};
