import { pool } from '../db.js';

function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// POST /api/orders
// Body: { payment_method: 'transferencia' | 'efectivo', address_id? , address? }
// address puede venir como { recipient_name, phone, street, city, state, zip_code, save? }
export async function checkout(req, res) {
  const userId = req.user.sub;
  const { payment_method, address_id, address } = req.body;

  if (!['transferencia', 'efectivo'].includes(payment_method)) {
    return res.status(400).json({ error: "payment_method debe ser 'transferencia' o 'efectivo'" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Items de la canasta (precio actual de cada variante)
    const { rows: cartItems } = await client.query(
      `SELECT ci.variant_id, ci.quantity, pv.price
       FROM cart_items ci
       JOIN product_variants pv ON pv.id = ci.variant_id
       WHERE ci.user_id = $1 AND pv.is_active = TRUE`,
      [userId]
    );
    if (cartItems.length === 0) {
      throw { status: 400, message: 'La canasta está vacía' };
    }

    // 2. Dirección de envío: existente guardada, o una nueva (con opción de guardarla)
    let shipping;
    if (address_id) {
      const { rows } = await client.query(
        `SELECT recipient_name, phone, street, city, state, zip_code
         FROM user_addresses WHERE id = $1 AND user_id = $2`,
        [address_id, userId]
      );
      if (!rows[0]) throw { status: 404, message: 'Dirección no encontrada' };
      shipping = rows[0];
    } else if (address) {
      const { recipient_name, phone, street, city, state, zip_code, save } = address;
      if (!recipient_name || !phone || !street || !city || !state || !zip_code) {
        throw { status: 400, message: 'Faltan campos de la dirección de envío' };
      }
      shipping = { recipient_name, phone, street, city, state, zip_code };
      if (save) {
        await client.query(
          `INSERT INTO user_addresses (user_id, recipient_name, phone, street, city, state, zip_code)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [userId, recipient_name, phone, street, city, state, zip_code]
        );
      }
    } else {
      throw { status: 400, message: 'Se requiere address_id o address' };
    }

    // 3. Crear la orden. expires_at solo aplica a transferencia (10 minutos), lo calculamos aquí
    //    en vez de con un CASE WHEN en SQL para no reutilizar el mismo parámetro con dos tipos distintos.
    const status = payment_method === 'transferencia' ? 'pendiente_pago' : 'apartado';
    const expiresAt = payment_method === 'transferencia' ? new Date(Date.now() + 10 * 60 * 1000) : null;

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (
         user_id, order_number, payment_method, status, expires_at,
         shipping_recipient_name, shipping_phone, shipping_street, shipping_city, shipping_state, shipping_zip_code
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [userId, generateOrderNumber(), payment_method, status, expiresAt,
       shipping.recipient_name, shipping.phone, shipping.street, shipping.city, shipping.state, shipping.zip_code]
    );
    const order = orderRows[0];

    // 4. Insertar líneas: el trigger de la BD valida disponibilidad, reserva stock,
    //    congela nombre/talla/precio, y va sumando orders.total automáticamente.
    for (const item of cartItems) {
      await client.query(
        `INSERT INTO order_items (order_id, variant_id, quantity, unit_price) VALUES ($1,$2,$3,$4)`,
        [order.id, item.variant_id, item.quantity, item.price]
      );
    }

    // 5. Vaciar la canasta ya comprada
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    await client.query('COMMIT');

    const { rows: finalOrder } = await pool.query(
      `SELECT o.*, (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o WHERE o.id = $1`,
      [order.id]
    );
    res.status(201).json({ order: finalOrder[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (err.message?.includes('Disponibilidad insuficiente')) {
      return res.status(409).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al procesar la orden' });
  } finally {
    client.release();
  }
}

// GET /api/orders — órdenes del usuario autenticado
export async function listMyOrders(req, res) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.sub]
    );
    res.json({ orders: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar las órdenes' });
  }
}

// GET /api/orders/:id
export async function getMyOrder(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, (SELECT json_agg(oi) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o WHERE o.id = $1 AND o.user_id = $2`,
      [req.params.id, req.user.sub]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Orden no encontrada' });
    res.json({ order: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la orden' });
  }
}

// POST /api/orders/:id/proof — subir comprobante de transferencia (multipart/form-data, campo "proof")
export async function uploadProof(req, res) {
  const { id } = req.params;
  const userId = req.user.sub;
  const { payment_reference } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Se requiere el archivo del comprobante (campo "proof")' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [id, userId]);
    const order = rows[0];
    if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
    if (order.payment_method !== 'transferencia') {
      return res.status(400).json({ error: 'Esta orden no es por transferencia' });
    }
    if (order.status !== 'pendiente_pago') {
      return res.status(400).json({ error: `No se puede subir comprobante: la orden ya está en estado '${order.status}'` });
    }

    const proofUrl = `/uploads/proofs/${req.file.filename}`;
    const { rows: updated } = await pool.query(
      `UPDATE orders SET payment_proof_url = $1, payment_reference = COALESCE($2, payment_reference)
       WHERE id = $3 RETURNING *`,
      [proofUrl, payment_reference || null, id]
    );
    res.json({ order: updated[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ese folio de referencia ya fue usado en otra orden' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al subir el comprobante' });
  }
}
