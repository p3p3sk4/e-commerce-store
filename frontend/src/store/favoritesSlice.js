import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  addFavoriteRequest,
  fetchFavoriteIds,
  fetchFavorites,
  removeFavoriteRequest,
} from '../api/favorites.js';

export const loadFavorites = createAsyncThunk('favorites/loadFavorites', async () =>
  fetchFavorites()
);

export const loadFavoriteIds = createAsyncThunk('favorites/loadFavoriteIds', async () =>
  fetchFavoriteIds()
);

export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async ({ productId, isFavorite }) => {
    if (isFavorite) {
      await removeFavoriteRequest(productId);
    } else {
      await addFavoriteRequest(productId);
    }
    return { productId, isFavorite: !isFavorite };
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: [], // detalle, para la página de favoritos
    productIds: [], // solo ids, para marcar el corazón en el catálogo
    status: 'idle',
  },
  reducers: {
    resetFavorites(state) {
      state.items = [];
      state.productIds = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFavorites.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadFavorites.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(loadFavorites.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(loadFavoriteIds.fulfilled, (state, action) => {
        state.productIds = action.payload;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { productId, isFavorite } = action.payload;
        if (isFavorite) {
          if (!state.productIds.includes(productId)) state.productIds.push(productId);
        } else {
          state.productIds = state.productIds.filter((id) => id !== productId);
          state.items = state.items.filter((item) => item.id !== productId);
        }
      });
  },
});

export const { resetFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
