import { apiDelete, apiGet, apiSend } from './client.js';

// GET /api/cart
export async function fetchCart() {
  const { items } = await apiGet('/cart');
  return items;
}

// POST /api/cart  { variant_id, quantity }
export async function addCartItem(variantId, quantity) {
  return apiSend('POST', '/cart', { variant_id: variantId, quantity });
}

// PUT /api/cart/:variantId  { quantity }
export async function updateCartItem(variantId, quantity) {
  return apiSend('PUT', `/cart/${variantId}`, { quantity });
}

// DELETE /api/cart/:variantId
export async function removeCartItem(variantId) {
  return apiDelete(`/cart/${variantId}`);
}

// DELETE /api/cart
export async function clearCartRequest() {
  return apiDelete('/cart');
}
