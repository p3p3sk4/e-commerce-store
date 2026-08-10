import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { fetchBrands, fetchCategories, fetchProducts } from '../api/products.js';

const initialFilters = {
  search: '',
  category: '',
  brand: '',
  size: '',
  minPrice: '',
  maxPrice: '',
  page: 1,
  limit: 20,
};

export const loadProducts = createAsyncThunk(
  'catalog/loadProducts',
  async (filters) => fetchProducts(filters)
);

export const loadFilterOptions = createAsyncThunk(
  'catalog/loadFilterOptions',
  async () => {
    const [categories, brands] = await Promise.all([fetchCategories(), fetchBrands()]);
    return { categories, brands };
  }
);

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    products: [],
    categories: [],
    brands: [],
    filters: initialFilters,
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
    isSearchOpen: false,
  },
  reducers: {
    setFilter(state, action) {
      const { key, value } = action.payload;
      state.filters[key] = value;
      // Cualquier cambio de filtro regresa a la página 1.
      if (key !== 'page') {
        state.filters.page = 1;
      }
    },
    resetFilters(state) {
      state.filters = initialFilters;
    },
    openSearch(state) {
      state.isSearchOpen = true;
    },
    closeSearch(state) {
      state.isSearchOpen = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.products = action.payload;
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(loadFilterOptions.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
        state.brands = action.payload.brands;
      });
  },
});

export const { setFilter, resetFilters, openSearch, closeSearch } = catalogSlice.actions;
export default catalogSlice.reducer;
