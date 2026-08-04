import { apiGet, apiSend } from './client.js';

// GET /api/addresses
export async function fetchAddresses() {
  const { addresses } = await apiGet('/addresses');
  return addresses;
}

// POST /api/addresses
export async function createAddress(address) {
  const { address: created } = await apiSend('POST', '/addresses', address);
  return created;
}
