import { pool } from '../db.js';

// GET /api/favorites — detalle para la página de favoritos
export async function listFavorites(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
         p.id, p.name, c.name AS category, b.name AS brand,
         (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.position LIMIT 1) AS image_url,
         (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS min_price,
         (SELECT MAX(pv.price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS max_price,
         (SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS stock_quantity
       FROM favorites f
       JOIN products p ON p.id = f.product_id AND p.is_active = TRUE
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.sub]
    );
    res.json({ favorites: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar tus favoritos' });
  }
}

// GET /api/favorites/ids — solo los IDs, para marcar el corazón en el catálogo
// sin tener que pedir el detalle completo de cada producto
export async function listFavoriteIds(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT product_id FROM favorites WHERE user_id = $1`,
      [req.user.sub]
    );
    res.json({ productIds: rows.map((r) => r.product_id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar tus favoritos' });
  }
}

// POST /api/favorites/:productId
export async function addFavorite(req, res) {
  const { productId } = req.params;
  try {
    await pool.query(
      `INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [req.user.sub, productId]
    );
    res.status(201).json({ message: 'Agregado a favoritos' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar a favoritos' });
  }
}

// DELETE /api/favorites/:productId
export async function removeFavorite(req, res) {
  const { productId } = req.params;
  try {
    await pool.query(`DELETE FROM favorites WHERE user_id = $1 AND product_id = $2`, [
      req.user.sub,
      productId,
    ]);
    res.json({ message: 'Quitado de favoritos' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al quitar de favoritos' });
  }
}
