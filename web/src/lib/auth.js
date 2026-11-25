import { api, setToken } from './api.js';

const USER_KEY = 'mk.user';
export const HOME = { admin: '/admin', mr: '/mr', doctor: '/doctor', pharmacy: '/pharmacy', employee: '/employee' };

/** Signs in with email (or username) and password. Returns the user. */
export async function login(email, password) {
  const { token, user } = await api.post('/auth/login', { email, password });
  setToken(token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

/** Submits a registration request ({ role, name, email, phone, password, ...role details }) for admin approval. */
export const register = (body) => api.post('/auth/register', body);

/** Signed-in user ({ id, code, role, name, email, phone, meta, ... }) or null. */
export function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

/** Keeps the cached user in sync after profile edits. */
export const updateCurrentUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

export function logout() {
  setToken(null);
  localStorage.removeItem(USER_KEY);
}
