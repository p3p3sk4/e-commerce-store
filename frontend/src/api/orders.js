import { apiGet, apiSend, apiUpload } from './client.js';

// POST /api/orders  { payment_method, address }
export async function createOrder(payload) {
  const { order } = await apiSend('POST', '/orders', payload);
  return order;
}

// GET /api/orders
export async function fetchOrders() {
  const { orders } = await apiGet('/orders');
  return orders;
}

// GET /api/orders/:id
export async function fetchOrder(id) {
  const { order } = await apiGet(`/orders/${id}`);
  return order;
}

// POST /api/orders/:id/proof  (multipart/form-data: proof, payment_reference?)
export async function uploadPaymentProof(id, file, paymentReference) {
  const formData = new FormData();
  formData.append('proof', file);
  if (paymentReference) {
    formData.append('payment_reference', paymentReference);
  }
  const { order } = await apiUpload(`/orders/${id}/proof`, formData);
  return order;
}
