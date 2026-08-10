import { configureStore } from '@reduxjs/toolkit';
import catalogReducer from './catalogSlice.js';
import authReducer from './authSlice.js';
import cartReducer from './cartSlice.js';
import ordersReducer from './ordersSlice.js';
import favoritesReducer from './favoritesSlice.js';
import notificationsReducer from './notificationsSlice.js';

export const store = configureStore({
  reducer: {
    catalog: catalogReducer,
    auth: authReducer,
    cart: cartReducer,
    orders: ordersReducer,
    favorites: favoritesReducer,
    notifications: notificationsReducer,
  },
});
