import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  fetchCurrentUser,
  hasToken,
  loginRequest,
  logoutRequest,
  registerRequest,
} from '../api/auth.js';

export const login = createAsyncThunk('auth/login', async ({ identifier, password }) =>
  loginRequest(identifier, password)
);

export const register = createAsyncThunk('auth/register', async (data) => registerRequest(data));

// Al cargar la app, si hay un token guardado se intenta recuperar el usuario;
// si el token ya expiró o es inválido, se limpia la sesión silenciosamente.
export const restoreSession = createAsyncThunk('auth/restoreSession', async (_, { rejectWithValue }) => {
  if (!hasToken()) return null;
  try {
    return await fetchCurrentUser();
  } catch (err) {
    logoutRequest();
    return rejectWithValue(err.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
    checkedSession: false,
  },
  reducers: {
    logout(state) {
      logoutRequest();
      state.user = null;
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.checkedSession = true;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.user = null;
        state.checkedSession = true;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
