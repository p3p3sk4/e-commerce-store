import { pool } from '../db.js';

// GET /api/cart
export async function getCart(req, res) {
  const userId = req.user.sub;
  try {
    const { rows } = await pool.query(
      `SELECT ci.variant_id, ci.quantity,
              p.id AS product_id, p.name AS product_name,
              pv.size, pv.price,
              (pv.stock_quantity - pv.reserved_quantity) AS available_quantity
       FROM cart_items ci
       JOIN product_variants pv ON pv.id = ci.variant_id
       JOIN products p ON p.id = pv.product_id
       WHERE ci.user_id = $1 AND pv.is_active = TRUE AND p.is_active = TRUE
       ORDER BY ci.added_at`,
      [userId]
    );
    res.json({ items: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la canasta' });
  }
}

// POST /api/cart  { variant_id, quantity }
// Agregar a la canasta NUNCA descuenta inventario; solo se avisa si no hay suficiente disponible.
export async function addToCart(req, res) {
  const userId = req.user.sub;
  const { variant_id, quantity = 1 } = req.body;

  if (!variant_id || quantity <= 0) {
    return res.status(400).json({ error: 'variant_id y quantity (> 0) son obligatorios' });
  }

  try {
    const { rows: variantRows } = await pool.query(
      `SELECT stock_quantity - reserved_quantity AS available_quantity
       FROM product_variants WHERE id = $1 AND is_active = TRUE`,
      [variant_id]
    );
    if (!variantRows[0]) {
      return res.status(404).json({ error: 'Variante no encontrada' });
    }

    const { rows } = await pool.query(
      `INSERT INTO cart_items (user_id, variant_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, variant_id)
       DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
       RETURNING *`,
      [userId, variant_id, quantity]
    );

    const item = rows[0];
    const warning =
      item.quantity > variantRows[0].available_quantity
        ? 'La cantidad en tu canasta supera la disponibilidad actual; podría no alcanzar al momento de comprar'
        : null;

    res.status(201).json({ item, warning });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar a la canasta' });
  }
}

// PUT /api/cart/:variantId  { quantity }
export async function updateCartItem(req, res) {
  const userId = req.user.sub;
  const { variantId } = req.params;
  const { quantity } = req.body;

  if (quantity == null) return res.status(400).json({ error: 'quantity es obligatorio' });

  try {
    if (quantity <= 0) {
      await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND variant_id = $2', [userId, variantId]);
      return res.json({ message: 'Producto quitado de la canasta' });
    }

    const { rows } = await pool.query(
      `UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND variant_id = $3 RETURNING *`,
      [quantity, userId, variantId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Ese producto no está en tu canasta' });
    res.json({ item: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la canasta' });
  }
}

// DELETE /api/cart/:variantId
export async function removeCartItem(req, res) {
  const userId = req.user.sub;
  const { variantId } = req.params;
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND variant_id = $2', [userId, variantId]);
    res.json({ message: 'Producto quitado de la canasta' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al quitar el producto' });
  }
}

// DELETE /api/cart
export async function clearCart(req, res) {
  const userId = req.user.sub;
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    res.json({ message: 'Canasta vaciada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al vaciar la canasta' });
  }
}
