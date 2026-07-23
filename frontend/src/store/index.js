import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // Los slices (auth, productos, carrito, admin) se agregan en los próximos pasos.
  },
});
