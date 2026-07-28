import { pool } from '../../db.js';

// GET /api/admin/orders?status=
export async function listOrdersAdmin(req, res) {
  const { status = null } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM orders WHERE ($1::order_status IS NULL OR status = $1) ORDER BY created_at DESC`,
      [status]
    );
    res.json({ orders: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar las órdenes' });
  }
}

// GET /api/admin/orders/:id
export async function getOrderAdmin(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o WHERE o.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({ order: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
}

// PUT /api/admin/orders/:id/complete
// La base de datos valida todo: que no esté ya en un estado final, y que si es
// transferencia tenga comprobante subido. Aquí solo traducimos el error del trigger.
export async function completeOrder(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status = 'completado' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({ order: rows[0] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

// PUT /api/admin/orders/:id/cancel
export async function cancelOrder(req, res) {
  try {
    const { rows } = await pool.query(
      `UPDATE orders SET status = 'cancelado' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({ order: rows[0] });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
