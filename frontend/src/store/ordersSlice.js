import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createOrder, fetchOrder, uploadPaymentProof } from '../api/orders.js';

export const checkout = createAsyncThunk('orders/checkout', async (payload) => createOrder(payload));

export const loadOrder = createAsyncThunk('orders/loadOrder', async (orderId) => fetchOrder(orderId));

export const submitPaymentProof = createAsyncThunk(
  'orders/submitPaymentProof',
  async ({ orderId, file, paymentReference }) => uploadPaymentProof(orderId, file, paymentReference)
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    currentOrder: null,
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {
    clearCurrentOrder(state) {
      state.currentOrder = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkout.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(checkout.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentOrder = action.payload;
      })
      .addCase(checkout.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(loadOrder.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      })
      .addCase(submitPaymentProof.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      })
      .addCase(submitPaymentProof.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

export const { clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
