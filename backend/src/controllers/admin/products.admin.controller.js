import { pool } from '../../db.js';
import cloudinary from '../../config/cloudinary.js';
import streamifier from 'streamifier';

// ---------- CATEGORÍAS Y MARCAS ----------

export async function createCategory(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name es obligatorio' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json({ category: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Esa categoría ya existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
}

export async function createBrand(req, res) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name es obligatorio' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO brands (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json({ brand: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Esa marca ya existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al crear marca' });
  }
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name es obligatorio' });
  try {
    const { rows } = await pool.query(
      `UPDATE categories SET name = $1 WHERE id = $2 RETURNING *`,
      [name, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ category: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la categoría' });
  }
}

export async function updateBrand(req, res) {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name es obligatorio' });
  try {
    const { rows } = await pool.query(
      `UPDATE brands SET name = $1 WHERE id = $2 RETURNING *`,
      [name, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Marca no encontrada' });
    res.json({ brand: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una marca con ese nombre' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la marca' });
  }
}

// ---------- PRODUCTOS ----------

// Crea el producto junto con sus variantes iniciales (talla/color, precio, stock) en una sola transacción.
// Body esperado:
// { name, description, category_id, brand_id, variants: [{ size, price, stock_quantity, sku }] }
export async function createProduct(req, res) {
  const { name, description, category_id, brand_id, variants } = req.body;

  if (!name) return res.status(400).json({ error: 'name es obligatorio' });
  if (!Array.isArray(variants) || variants.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos una variante (talla/color, precio, stock)' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: productRows } = await client.query(
      `INSERT INTO products (name, description, category_id, brand_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description || null, category_id || null, brand_id || null]
    );
    const product = productRows[0];

    const insertedVariants = [];
    for (const v of variants) {
      if (!v.size || v.price == null) {
        throw new Error('Cada variante requiere size y price');
      }
      const { rows } = await client.query(
        `INSERT INTO product_variants (product_id, size, price, stock_quantity, sku)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [product.id, v.size, v.price, v.stock_quantity || 0, v.sku || null]
      );
      insertedVariants.push(rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json({ product: { ...product, variants: insertedVariants } });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      return res.status(409).json({ error: 'SKU o combinación producto/talla duplicada' });
    }
    console.error(err);
    res.status(400).json({ error: err.message || 'Error al crear el producto' });
  } finally {
    client.release();
  }
}

// Edita datos generales del producto (no toca variantes/inventario)
export async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, description, category_id, brand_id } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE products
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           category_id = COALESCE($3, category_id),
           brand_id = COALESCE($4, brand_id),
           updated_at = NOW()
       WHERE id = $5 AND is_active = TRUE
       RETURNING *`,
      [name, description, category_id, brand_id, id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ product: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el producto' });
  }
}

// "Quitar" un producto = desactivarlo, nunca DELETE (preserva historial de órdenes)
export async function deactivateProduct(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Producto no encontrado' });
    // También desactiva sus variantes, para que dejen de aparecer en el catálogo/filtros
    await pool.query(`UPDATE product_variants SET is_active = FALSE WHERE product_id = $1`, [id]);
    res.json({ message: 'Producto desactivado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desactivar el producto' });
  }
}

// ---------- VARIANTES (talla/color, precio, inventario) ----------

export async function addVariant(req, res) {
  const { id } = req.params; // product_id
  const { size, price, stock_quantity, sku } = req.body;
  if (!size || price == null) {
    return res.status(400).json({ error: 'size y price son obligatorios' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO product_variants (product_id, size, price, stock_quantity, sku)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, size, price, stock_quantity || 0, sku || null]
    );
    res.status(201).json({ variant: rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Esa talla/color ya existe para este producto, o el SKU ya está en uso' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al agregar la variante' });
  }
}

// Edita precio y/o stock de una variante. El cambio de stock_quantity queda
// registrado automáticamente como 'ajuste' en inventory_movements (trigger en la BD).
export async function updateVariant(req, res) {
  const { variantId } = req.params;
  const { price, stock_quantity, sku } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE product_variants
       SET price = COALESCE($1, price),
           stock_quantity = COALESCE($2, stock_quantity),
           sku = COALESCE($3, sku)
       WHERE id = $4
       RETURNING *`,
      [price, stock_quantity, sku, variantId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Variante no encontrada' });
    res.json({ variant: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar la variante' });
  }
}

// Descontinúa solo esta talla/color, sin afectar las demás variantes del producto
export async function deactivateVariant(req, res) {
  const { variantId } = req.params;
  try {
    const { rows } = await pool.query(
      `UPDATE product_variants SET is_active = FALSE WHERE id = $1 RETURNING id`,
      [variantId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Variante no encontrada' });
    res.json({ message: 'Variante desactivada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desactivar la variante' });
  }
}

// ---------- IMÁGENES ----------

export async function addImage(req, res) {
  const { id } = req.params; // product_id
  const { image_url, position = 0 } = req.body;
  if (!image_url) return res.status(400).json({ error: 'image_url es obligatorio' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO product_images (product_id, image_url, position) VALUES ($1, $2, $3) RETURNING *`,
      [id, image_url, position]
    );
    res.status(201).json({ image: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar la imagen' });
  }
}

export async function listProductImages(req, res) {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, image_url, position FROM product_images WHERE product_id = $1 ORDER BY position, id`,
      [id]
    );
    res.json({ images: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar las imágenes' });
  }
}

// Sube el archivo a Cloudinary (nube) y guarda la URL permanente que devuelve
// — así la imagen no depende del disco del servidor, que se borra en cada
// despliegue del backend.
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'hannkat-xio/products' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export async function uploadProductImageFile(req, res) {
  const { id } = req.params;
  const { position = 0 } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Se requiere el archivo de la imagen (campo "image")' });
  }

  try {
    const result = await uploadBufferToCloudinary(req.file.buffer);
    const { rows } = await pool.query(
      `INSERT INTO product_images (product_id, image_url, position) VALUES ($1, $2, $3) RETURNING *`,
      [id, result.secure_url, position]
    );
    res.status(201).json({ image: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
}

export async function deleteImage(req, res) {
  const { imageId } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM product_images WHERE id = $1', [imageId]);
    if (rowCount === 0) return res.status(404).json({ error: 'Imagen no encontrada' });
    res.json({ message: 'Imagen eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la imagen' });
  }
}
