import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  addCartItem,
  clearCartRequest,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from '../api/cart.js';

export const loadCart = createAsyncThunk('cart/loadCart', async () => fetchCart());

export const addToCart = createAsyncThunk('cart/addToCart', async ({ variantId, quantity }) => {
  await addCartItem(variantId, quantity);
  return fetchCart();
});

export const changeCartQuantity = createAsyncThunk(
  'cart/changeCartQuantity',
  async ({ variantId, quantity }) => {
    await updateCartItem(variantId, quantity);
    return fetchCart();
  }
);

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (variantId) => {
  await removeCartItem(variantId);
  return fetchCart();
});

export const clearCart = createAsyncThunk('cart/clearCart', async () => {
  await clearCartRequest();
  return [];
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
    // Distingue la primera carga (bloquea la pantalla) de acciones puntuales
    // como agregar/quitar un producto (no deben tapar el carrito completo).
    mutating: false,
  },
  reducers: {
    resetCart(state) {
      state.items = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadCart.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(loadCart.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addMatcher(
        (action) =>
          [addToCart.pending, changeCartQuantity.pending, removeFromCart.pending, clearCart.pending].some(
            (thunk) => thunk.type === action.type
          ),
        (state) => {
          state.mutating = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) =>
          [
            addToCart.fulfilled,
            changeCartQuantity.fulfilled,
            removeFromCart.fulfilled,
            clearCart.fulfilled,
          ].some((thunk) => thunk.type === action.type),
        (state, action) => {
          state.mutating = false;
          state.status = 'succeeded';
          state.items = action.payload;
        }
      )
      .addMatcher(
        (action) =>
          [
            addToCart.rejected,
            changeCartQuantity.rejected,
            removeFromCart.rejected,
            clearCart.rejected,
          ].some((thunk) => thunk.type === action.type),
        (state, action) => {
          state.mutating = false;
          state.error = action.error.message;
        }
      );
  },
});

export const { resetCart } = cartSlice.actions;
export default cartSlice.reducer;
