import { apiGet, getToken } from './client.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// GET /api/admin/customers
export async function fetchCustomersAdmin() {
  const { customers } = await apiGet('/admin/customers');
  return customers;
}

// GET /api/admin/customers/export — descarga el .xlsx (necesita el token,
// así que no puede ser un <a href> simple: se pide como blob y se dispara
// la descarga manualmente).
export async function downloadCustomersExport() {
  const res = await fetch(`${BASE_URL}/admin/customers/export`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    throw new Error('No se pudo descargar el archivo de clientes');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'clientes.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
