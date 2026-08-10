import { apiGet, apiSend } from './client.js';

// GET /api/notifications
export async function fetchNotifications() {
  const { notifications } = await apiGet('/notifications');
  return notifications;
}

// PUT /api/notifications/:id/read
export async function markNotificationReadRequest(id) {
  return apiSend('PUT', `/notifications/${id}/read`);
}

// PUT /api/notifications/read-all
export async function markAllNotificationsReadRequest() {
  return apiSend('PUT', '/notifications/read-all');
}
