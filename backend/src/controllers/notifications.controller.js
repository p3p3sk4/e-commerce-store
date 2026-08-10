import { pool } from '../db.js';

// GET /api/notifications
export async function listNotifications(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, order_id, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.sub]
    );
    res.json({ notifications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar tus notificaciones' });
  }
}

// PUT /api/notifications/:id/read
export async function markNotificationRead(req, res) {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`, [
      id,
      req.user.sub,
    ]);
    res.json({ message: 'Notificación marcada como leída' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la notificación' });
  }
}

// PUT /api/notifications/read-all
export async function markAllNotificationsRead(req, res) {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [req.user.sub]
    );
    res.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar las notificaciones' });
  }
}
