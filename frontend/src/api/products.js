import { apiGet } from './client.js';

// GET /api/products?search=&category=&brand=&size=&minPrice=&maxPrice=&page=&limit=
export async function fetchProducts(filters) {
  const { products } = await apiGet('/products', filters);
  return products;
}

// GET /api/products/:id
export async function fetchProduct(id) {
  const { product } = await apiGet(`/products/${id}`);
  return product;
}

// GET /api/categories — para poblar el sidebar de filtros
export async function fetchCategories() {
  const { categories } = await apiGet('/categories');
  return categories;
}

// GET /api/brands — para poblar el sidebar de filtros
export async function fetchBrands() {
  const { brands } = await apiGet('/brands');
  return brands;
}
