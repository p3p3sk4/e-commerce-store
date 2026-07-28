import { configureStore } from '@reduxjs/toolkit';
import catalogReducer from './catalogSlice.js';

export const store = configureStore({
  reducer: {
    catalog: catalogReducer,
  },
});
