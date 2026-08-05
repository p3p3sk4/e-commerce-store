import { apiDelete, apiGet, apiSend, apiUpload } from './client.js';

// ---------- Categorías y marcas ----------
export async function createCategory(name) {
  const { category } = await apiSend('POST', '/admin/categories', { name });
  return category;
}

export async function updateCategoryAdmin(id, name) {
  const { category } = await apiSend('PUT', `/admin/categories/${id}`, { name });
  return category;
}

export async function createBrand(name) {
  const { brand } = await apiSend('POST', '/admin/brands', { name });
  return brand;
}

export async function updateBrandAdmin(id, name) {
  const { brand } = await apiSend('PUT', `/admin/brands/${id}`, { name });
  return brand;
}

// ---------- Productos ----------
// { name, description, category_id, brand_id, variants: [{ size, price, stock_quantity, sku }] }
export async function createProductAdmin(payload) {
  const { product } = await apiSend('POST', '/admin/products', payload);
  return product;
}

// { name?, description?, category_id?, brand_id? }
export async function updateProductAdmin(id, payload) {
  const { product } = await apiSend('PUT', `/admin/products/${id}`, payload);
  return product;
}

export async function deactivateProductAdmin(id) {
  return apiDelete(`/admin/products/${id}`);
}

// ---------- Variantes ----------
// { size, price, stock_quantity, sku }
export async function addVariantAdmin(productId, payload) {
  const { variant } = await apiSend('POST', `/admin/products/${productId}/variants`, payload);
  return variant;
}

// { price?, stock_quantity?, sku? }
export async function updateVariantAdmin(variantId, payload) {
  const { variant } = await apiSend('PUT', `/admin/variants/${variantId}`, payload);
  return variant;
}

export async function deactivateVariantAdmin(variantId) {
  return apiDelete(`/admin/variants/${variantId}`);
}

// ---------- Imágenes ----------
// { image_url, position }
export async function addImageAdmin(productId, payload) {
  const { image } = await apiSend('POST', `/admin/products/${productId}/images`, payload);
  return image;
}

// Sube un archivo real (multipart/form-data) en vez de una URL
export async function uploadProductImageAdmin(productId, file) {
  const formData = new FormData();
  formData.append('image', file);
  const { image } = await apiUpload(`/admin/products/${productId}/images/upload`, formData);
  return image;
}

// GET /api/admin/products/:id/images — con id, para poder borrarlas
export async function fetchProductImagesAdmin(productId) {
  const { images } = await apiGet(`/admin/products/${productId}/images`);
  return images;
}

export async function deleteImageAdmin(imageId) {
  return apiDelete(`/admin/images/${imageId}`);
}
