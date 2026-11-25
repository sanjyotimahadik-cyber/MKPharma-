// Thin fetch wrapper for the backend (proxied to the API server by Vite in dev).
const TOKEN_KEY = 'mk.token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(method, path, body) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new Error('Cannot reach the server. Is the API running?');
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.status === 401 && token) {
    setToken(null);
    localStorage.removeItem('mk.user');
    window.location.assign('/login');
  }
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data;
}

/** api.get('/products'), api.post('/orders', body), api.put(...), api.patch(...), api.del(...). Errors throw with a readable message. */
export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  put: (path, body = {}) => request('PUT', path, body),
  patch: (path, body = {}) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
};

/** Builds '?a=1&b=2' from an object, skipping empty values. */
export const qs = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
  return s ? `?${s}` : '';
};
