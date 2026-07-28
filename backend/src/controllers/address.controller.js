import { pool } from '../db.js';

// GET /api/addresses
export async function listAddresses(req, res) {
  const userId = req.user.sub;
  try {
    const { rows } = await pool.query(
      'SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    res.json({ addresses: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las direcciones' });
  }
}

// POST /api/addresses
export async function createAddress(req, res) {
  const userId = req.user.sub;
  const { label, recipient_name, phone, street, city, state, zip_code, is_default } = req.body;

  if (!recipient_name || !phone || !street || !city || !state || !zip_code) {
    return res.status(400).json({ error: 'Faltan campos obligatorios de la dirección' });
  }

  try {
    if (is_default) {
      await pool.query('UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1', [userId]);
    }
    const { rows } = await pool.query(
      `INSERT INTO user_addresses (user_id, label, recipient_name, phone, street, city, state, zip_code, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [userId, label || null, recipient_name, phone, street, city, state, zip_code, !!is_default]
    );
    res.status(201).json({ address: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar la dirección' });
  }
}
