import { apiGet, apiSend } from './client.js';

// GET /api/admin/orders?status=
export async function fetchOrdersAdmin(status) {
  const { orders } = await apiGet('/admin/orders', status ? { status } : undefined);
  return orders;
}

// GET /api/admin/orders/:id
export async function fetchOrderAdmin(id) {
  const { order } = await apiGet(`/admin/orders/${id}`);
  return order;
}

// PUT /api/admin/orders/:id/complete
export async function completeOrderAdmin(id) {
  const { order } = await apiSend('PUT', `/admin/orders/${id}/complete`);
  return order;
}

// PUT /api/admin/orders/:id/cancel
export async function cancelOrderAdmin(id) {
  const { order } = await apiSend('PUT', `/admin/orders/${id}/cancel`);
  return order;
}
