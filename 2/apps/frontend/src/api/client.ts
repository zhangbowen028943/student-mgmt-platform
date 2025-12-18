import axios from 'axios';
import { store } from '../store';
import { setTokens, logout } from '../store/slices/auth';

const client = axios.create({
  baseURL: '/'
});

let csrfToken: string | null = null;

async function ensureCsrf() {
  if (csrfToken) return;
  try {
    const r = await axios.get('/api/csrf-token', { withCredentials: true });
    csrfToken = r.data?.csrfToken || null;
  } catch {}
}

client.interceptors.request.use(config => {
  const state = store.getState().auth;
  if (state.token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${state.token}`;
  }
  config.withCredentials = true;
  config.headers = config.headers || {};
  if (csrfToken) config.headers['x-csrf-token'] = csrfToken;
  return config;
});

client.interceptors.response.use(
  res => res,
  async error => {
    const status = error.response?.status;
    const original = error.config;
    const state = store.getState().auth;
    if (status === 401 && state.refreshToken && !original._retry) {
      original._retry = true;
      try {
        const r = await axios.post('/api/auth/refresh', { refreshToken: state.refreshToken });
        store.dispatch(setTokens({ token: r.data.token }));
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${r.data.token}`;
        return client(original);
      } catch {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

ensureCsrf();

export default client;
