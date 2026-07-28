import { pool } from '../db.js';

// GET /api/products?search=&category=&brand=&size=&minPrice=&maxPrice=&page=&limit=
// Catálogo público: solo productos activos, con sus variantes activas y disponibilidad real
// (stock_quantity - reserved_quantity), no el inventario físico crudo.
export async function listProducts(req, res) {
  const {
    search = null,
    category = null,
    brand = null,
    size = null,
    minPrice = null,
    maxPrice = null,
    page = 1,
    limit = 20,
  } = req.query;

  const offset = (Math.max(1, Number(page)) - 1) * Number(limit);

  try {
    const { rows } = await pool.query(
      `SELECT
         p.id, p.name, p.description,
         c.name AS category, b.name AS brand,
         (SELECT json_agg(pi.image_url ORDER BY pi.position)
            FROM product_images pi WHERE pi.product_id = p.id) AS images,
         (SELECT json_agg(json_build_object(
                    'id', pv.id,
                    'size', pv.size,
                    'price', pv.price,
                    'available_quantity', pv.stock_quantity - pv.reserved_quantity
                  ) ORDER BY pv.size)
            FROM product_variants pv
            WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS variants
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.is_active = TRUE
         AND ($1::text IS NULL OR to_tsvector('spanish', p.name) @@ plainto_tsquery('spanish', $1))
         AND ($2::text IS NULL OR c.name = $2)
         AND ($3::text IS NULL OR b.name = $3)
         AND ($4::text IS NULL OR EXISTS (
               SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.size = $4 AND pv.is_active = TRUE))
         AND ($5::numeric IS NULL OR EXISTS (
               SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.price >= $5 AND pv.is_active = TRUE))
         AND ($6::numeric IS NULL OR EXISTS (
               SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.price <= $6 AND pv.is_active = TRUE))
       ORDER BY p.created_at DESC
       LIMIT $7 OFFSET $8`,
      [search, category, brand, size, minPrice, maxPrice, limit, offset]
    );

    res.json({ products: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar productos' });
  }
}

// GET /api/products/:id
export async function getProduct(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT
         p.id, p.name, p.description,
         c.name AS category, b.name AS brand,
         (SELECT json_agg(pi.image_url ORDER BY pi.position)
            FROM product_images pi WHERE pi.product_id = p.id) AS images,
         (SELECT json_agg(json_build_object(
                    'id', pv.id,
                    'size', pv.size,
                    'price', pv.price,
                    'available_quantity', pv.stock_quantity - pv.reserved_quantity
                  ) ORDER BY pv.size)
            FROM product_variants pv
            WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS variants
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN brands b ON b.id = p.brand_id
       WHERE p.id = $1 AND p.is_active = TRUE`,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el producto' });
  }
}

// GET /api/categories — para poblar el sidebar de filtros
export async function listCategories(req, res) {
  try {
    const { rows } = await pool.query('SELECT id, name FROM categories ORDER BY name');
    res.json({ categories: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar categorías' });
  }
}

// GET /api/brands — para poblar el sidebar de filtros
export async function listBrands(req, res) {
  try {
    const { rows } = await pool.query('SELECT id, name FROM brands ORDER BY name');
    res.json({ brands: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar marcas' });
  }
}
