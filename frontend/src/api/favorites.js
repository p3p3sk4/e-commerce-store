import { apiDelete, apiGet, apiSend } from './client.js';

// GET /api/favorites
export async function fetchFavorites() {
  const { favorites } = await apiGet('/favorites');
  return favorites;
}

// GET /api/favorites/ids
export async function fetchFavoriteIds() {
  const { productIds } = await apiGet('/favorites/ids');
  return productIds;
}

// POST /api/favorites/:productId
export async function addFavoriteRequest(productId) {
  return apiSend('POST', `/favorites/${productId}`);
}

// DELETE /api/favorites/:productId
export async function removeFavoriteRequest(productId) {
  return apiDelete(`/favorites/${productId}`);
}
