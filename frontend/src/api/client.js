const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const TOKEN_STORAGE_KEY = 'tienda_token';

// El backend a veces devuelve rutas relativas para archivos subidos
// (ej. "/uploads/products/foto.jpg"). El navegador las resolvería contra el
// origen del FRONTEND si se usan tal cual, así que hay que anteponerles el
// origen real del backend antes de ponerlas en un <img src>.
const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

export function resolveMediaUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path; // ya es una URL completa
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      search.set(key, value);
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res, path) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Error ${res.status} al consultar ${path}`);
  }
  return res.json();
}

export async function apiGet(path, params) {
  const url = `${BASE_URL}${path}${buildQuery(params)}`;
  const res = await fetch(url, { headers: { ...authHeaders() } });
  return handleResponse(res, path);
}

export async function apiSend(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse(res, path);
}

export async function apiDelete(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  return handleResponse(res, path);
}

// Para subir el comprobante de pago (multipart/form-data). No se fija
// Content-Type a mano: el navegador debe poner el boundary correcto.
export async function apiUpload(path, formData) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: formData,
  });
  return handleResponse(res, path);
}
