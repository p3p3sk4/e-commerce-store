import { apiGet, apiSend, setToken, getToken } from './client.js';

// POST /api/auth/register  { full_name, email?, phone?, password }
export async function registerRequest(data) {
  const { user, token } = await apiSend('POST', '/auth/register', data);
  setToken(token);
  return user;
}

// POST /api/auth/login  { identifier, password }
export async function loginRequest(identifier, password) {
  const { user, token } = await apiSend('POST', '/auth/login', { identifier, password });
  setToken(token);
  return user;
}

export function logoutRequest() {
  setToken(null);
}

export function hasToken() {
  return Boolean(getToken());
}

// GET /api/auth/me — para restaurar la sesión al recargar la página
export async function fetchCurrentUser() {
  const { user } = await apiGet('/auth/me');
  return user;
}
