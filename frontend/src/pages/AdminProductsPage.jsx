import { useEffect, useRef, useState } from 'react';
import { fetchProducts, fetchCategories, fetchBrands } from '../api/products.js';
import {
  addImageAdmin,
  addVariantAdmin,
  createBrand,
  createCategory,
  createProductAdmin,
  deactivateProductAdmin,
  deactivateVariantAdmin,
  deleteImageAdmin,
  fetchProductImagesAdmin,
  updateBrandAdmin,
  updateCategoryAdmin,
  updateProductAdmin,
  updateVariantAdmin,
  uploadProductImageAdmin,
} from '../api/admin.js';
import { resolveMediaUrl } from '../api/client.js';
import { ImageViewer } from '../components/ImageViewer.jsx';
import './AdminProductsPage.css';

const EMPTY_VARIANT = { size: '', price: '', stock_quantity: '' };
const EMPTY_PRODUCT = { name: '', description: '', category_id: '', brand_id: '' };

export function AdminProductsPage() {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProduct, setNewProduct] = useState(EMPTY_PRODUCT);
  const [newVariants, setNewVariants] = useState([{ ...EMPTY_VARIANT }]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newBrandName, setNewBrandName] = useState('');

  const reload = () => {
    fetchProducts({ limit: 100 })
      .then(setProducts)
      .catch((err) => setError(err.message));
  };

  useEffect(() => {
    reload();
    fetchCategories().then(setCategories).catch(() => {});
    fetchBrands().then(setBrands).catch(() => {});
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    const category = await createCategory(newCategoryName.trim());
    setCategories((prev) => [...prev, category]);
    setNewProduct((prev) => ({ ...prev, category_id: category.id }));
    setNewCategoryName('');
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    const brand = await createBrand(newBrandName.trim());
    setBrands((prev) => [...prev, brand]);
    setNewProduct((prev) => ({ ...prev, brand_id: brand.id }));
    setNewBrandName('');
  };

  const handleRenameCategory = async () => {
    if (!newProduct.category_id) return;
    const current = categories.find((c) => c.id === Number(newProduct.category_id));
    const nextName = prompt('Nuevo nombre de la categoría:', current?.name || '');
    if (!nextName || !nextName.trim()) return;
    const updated = await updateCategoryAdmin(newProduct.category_id, nextName.trim());
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    reload();
  };

  const handleRenameBrand = async () => {
    if (!newProduct.brand_id) return;
    const current = brands.find((b) => b.id === Number(newProduct.brand_id));
    const nextName = prompt('Nuevo nombre de la marca:', current?.name || '');
    if (!nextName || !nextName.trim()) return;
    const updated = await updateBrandAdmin(newProduct.brand_id, nextName.trim());
    setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    reload();
  };

  const updateNewVariant = (index, field, value) => {
    setNewVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const handleCreateProduct = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await createProductAdmin({
        name: newProduct.name,
        description: newProduct.description,
        category_id: newProduct.category_id || null,
        brand_id: newProduct.brand_id || null,
        variants: newVariants
          .filter((v) => v.size && v.price !== '')
          .map((v) => ({
            size: v.size,
            price: Number(v.price),
            stock_quantity: Number(v.stock_quantity) || 0,
          })),
      });
      setNewProduct(EMPTY_PRODUCT);
      setNewVariants([{ ...EMPTY_VARIANT }]);
      setShowCreateForm(false);
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivateProduct = async (id) => {
    if (!confirm('¿Desactivar este producto? Dejará de verse en el catálogo.')) return;
    await deactivateProductAdmin(id);
    reload();
  };

  const handleDeactivateVariant = async (id) => {
    if (!confirm('¿Desactivar esta talla/variante?')) return;
    await deactivateVariantAdmin(id);
    reload();
  };

  if (error) return <p className="admin-products__error">{error}</p>;
  if (!products) return <p>Cargando productos...</p>;

  return (
    <div className="admin-products">
      <div className="admin-products__header">
        <h1>Productos</h1>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => setShowCreateForm((v) => !v)}>
          {showCreateForm ? 'Cancelar' : '+ Nuevo producto'}
        </button>
      </div>

      {showCreateForm && (
        <form className="admin-products__create-form" onSubmit={handleCreateProduct}>
          <div className="admin-form-grid">
            <input
              placeholder="Nombre"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
            <input
              placeholder="Descripción"
              value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            />

            <div className="admin-inline-add">
              <select
                value={newProduct.category_id}
                onChange={(e) => setNewProduct({ ...newProduct, category_id: e.target.value })}
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Nueva categoría"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button type="button" className="admin-btn" onClick={handleAddCategory}>
                Agregar
              </button>
              <button
                type="button"
                className="admin-btn"
                disabled={!newProduct.category_id}
                onClick={handleRenameCategory}
              >
                Renombrar
              </button>
            </div>

            <div className="admin-inline-add">
              <select
                value={newProduct.brand_id}
                onChange={(e) => setNewProduct({ ...newProduct, brand_id: e.target.value })}
              >
                <option value="">Sin marca</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="Nueva marca"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
              />
              <button type="button" className="admin-btn" onClick={handleAddBrand}>
                Agregar
              </button>
              <button
                type="button"
                className="admin-btn"
                disabled={!newProduct.brand_id}
                onClick={handleRenameBrand}
              >
                Renombrar
              </button>
            </div>
          </div>

          <h3 className="admin-products__variants-title">Tallas / variantes</h3>
          {newVariants.map((variant, index) => (
            <div key={index} className="admin-variant-row">
              <input
                placeholder="Talla"
                value={variant.size}
                onChange={(e) => updateNewVariant(index, 'size', e.target.value)}
              />
              <input
                type="number"
                placeholder="Precio"
                value={variant.price}
                onChange={(e) => updateNewVariant(index, 'price', e.target.value)}
              />
              <input
                type="number"
                placeholder="Inventario"
                value={variant.stock_quantity}
                onChange={(e) => updateNewVariant(index, 'stock_quantity', e.target.value)}
              />
              {newVariants.length > 1 && (
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  onClick={() => setNewVariants((prev) => prev.filter((_, i) => i !== index))}
                >
                  Quitar
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="admin-btn"
            onClick={() => setNewVariants((prev) => [...prev, { ...EMPTY_VARIANT }])}
          >
            + Agregar talla
          </button>

          <div className="admin-products__create-footer">
            <button type="submit" className="admin-btn admin-btn--primary">
              Crear producto
            </button>
          </div>
        </form>
      )}

      <ul className="admin-products__list">
        {products.map((product) => (
          <AdminProductRow
            key={product.id}
            product={product}
            onDeactivateProduct={handleDeactivateProduct}
            onDeactivateVariant={handleDeactivateVariant}
            onReload={reload}
          />
        ))}
      </ul>
    </div>
  );
}

function AdminProductRow({ product, onDeactivateProduct, onDeactivateVariant, onReload }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description || '');
  const [newVariant, setNewVariant] = useState({ ...EMPTY_VARIANT });
  const [newImageUrl, setNewImageUrl] = useState('');
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageMessage, setImageMessage] = useState(null);
  const [rowError, setRowError] = useState(null);
  const [images, setImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(null);

  const loadImages = () => {
    fetchProductImagesAdmin(product.id)
      .then(setImages)
      .catch((err) => setRowError(err.message));
  };

  useEffect(() => {
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const handleSaveGeneral = async () => {
    setRowError(null);
    try {
      await updateProductAdmin(product.id, { name, description });
      setEditing(false);
      onReload();
    } catch (err) {
      setRowError(err.message);
    }
  };

  const handleVariantField = async (variantId, field, value) => {
    setRowError(null);
    try {
      await updateVariantAdmin(variantId, { [field]: value === '' ? undefined : Number(value) });
      onReload();
    } catch (err) {
      setRowError(err.message);
    }
  };

  const handleAddVariant = async () => {
    if (!newVariant.size || newVariant.price === '') return;
    setRowError(null);
    try {
      await addVariantAdmin(product.id, {
        size: newVariant.size,
        price: Number(newVariant.price),
        stock_quantity: Number(newVariant.stock_quantity) || 0,
      });
      setNewVariant({ ...EMPTY_VARIANT });
      onReload();
    } catch (err) {
      setRowError(err.message);
    }
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    setRowError(null);
    setImageMessage(null);
    try {
      await addImageAdmin(product.id, { image_url: newImageUrl.trim() });
      setNewImageUrl('');
      setImageMessage('Imagen agregada correctamente.');
      loadImages();
      onReload();
    } catch (err) {
      setRowError(err.message);
    }
  };

  const handleUploadImage = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setRowError('Primero elige un archivo con "Seleccionar archivo".');
      return;
    }
    setRowError(null);
    setImageMessage(null);
    setUploadingImage(true);
    try {
      await uploadProductImageAdmin(product.id, file);
      setImageMessage('Imagen subida y guardada correctamente.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadImages();
      onReload();
    } catch (err) {
      setRowError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    setRowError(null);
    try {
      await deleteImageAdmin(imageId);
      loadImages();
      onReload();
    } catch (err) {
      setRowError(err.message);
    }
  };

  return (
    <li className="admin-product-row">
      {rowError && <p className="admin-product-row__error">{rowError}</p>}
      <div className="admin-product-row__header">
        {editing ? (
          <div className="admin-inline-add">
            <input value={name} onChange={(e) => setName(e.target.value)} />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción" />
            <button type="button" className="admin-btn admin-btn--primary" onClick={handleSaveGeneral}>
              Guardar
            </button>
          </div>
        ) : (
          <>
            <div>
              <strong>{product.name}</strong>
              <span className="admin-product-row__meta">
                {product.category || 'Sin categoría'} · {product.brand || 'Sin marca'}
              </span>
            </div>
            <div className="admin-product-row__actions">
              <button type="button" className="admin-btn" onClick={() => setEditing(true)}>
                Editar
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => onDeactivateProduct(product.id)}
              >
                Desactivar
              </button>
            </div>
          </>
        )}
      </div>

      <table className="admin-variant-table">
        <thead>
          <tr>
            <th>Talla</th>
            <th>Precio</th>
            <th>Inventario</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(product.variants || []).map((variant) => (
            <tr key={variant.id}>
              <td>{variant.size}</td>
              <td>
                <input
                  type="number"
                  defaultValue={variant.price}
                  onBlur={(e) => handleVariantField(variant.id, 'price', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="number"
                  defaultValue={variant.available_quantity}
                  onBlur={(e) => handleVariantField(variant.id, 'stock_quantity', e.target.value)}
                />
              </td>
              <td>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger"
                  onClick={() => onDeactivateVariant(variant.id)}
                >
                  Quitar
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td>
              <input
                placeholder="Talla nueva"
                value={newVariant.size}
                onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
              />
            </td>
            <td>
              <input
                type="number"
                placeholder="Precio"
                value={newVariant.price}
                onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
              />
            </td>
            <td>
              <input
                type="number"
                placeholder="Inventario"
                value={newVariant.stock_quantity}
                onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: e.target.value })}
              />
            </td>
            <td>
              <button type="button" className="admin-btn" onClick={handleAddVariant}>
                + Agregar
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {images.length > 0 && (
        <div className="admin-product-row__gallery">
          {images.map((img, index) => (
            <div key={img.id} className="admin-product-row__gallery-item">
              <img
                src={resolveMediaUrl(img.image_url)}
                alt={product.name}
                className="admin-product-row__thumb"
                onClick={() => setViewerIndex(index)}
              />
              <button
                type="button"
                className="admin-product-row__thumb-delete"
                title="Eliminar imagen"
                onClick={() => handleDeleteImage(img.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {viewerIndex !== null && (
        <ImageViewer
          images={images.map((img) => resolveMediaUrl(img.image_url))}
          index={viewerIndex}
          alt={product.name}
          onClose={() => setViewerIndex(null)}
          onChangeIndex={setViewerIndex}
          renderExtra={(i) => (
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={() => {
                handleDeleteImage(images[i].id);
                if (images.length <= 1) setViewerIndex(null);
              }}
            >
              Eliminar esta imagen
            </button>
          )}
        />
      )}

      {imageMessage && <p className="admin-product-row__success">{imageMessage}</p>}

      <div className="admin-product-row__images">
        <div className="admin-product-row__image-option">
          <input
            placeholder="URL de imagen (http:// o https://)"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
          />
          <button type="button" className="admin-btn" onClick={handleAddImage}>
            + Agregar por URL
          </button>
        </div>
        <div className="admin-product-row__image-option">
          <input type="file" accept="image/jpeg,image/png,image/webp" ref={fileInputRef} />
          <button type="button" className="admin-btn" disabled={uploadingImage} onClick={handleUploadImage}>
            {uploadingImage ? 'Subiendo...' : '+ Subir desde mi equipo'}
          </button>
        </div>
      </div>
    </li>
  );
}
