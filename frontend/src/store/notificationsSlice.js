import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  fetchNotifications,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
} from '../api/notifications.js';

export const loadNotifications = createAsyncThunk('notifications/loadNotifications', async () =>
  fetchNotifications()
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markNotificationRead',
  async (id) => {
    await markNotificationReadRequest(id);
    return id;
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllNotificationsRead',
  async () => {
    await markAllNotificationsReadRequest();
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    status: 'idle',
  },
  reducers: {
    resetNotifications(state) {
      state.items = [];
      state.status = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(loadNotifications.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notif = state.items.find((n) => n.id === action.payload);
        if (notif) notif.is_read = true;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.is_read = true;
        });
      });
  },
});

export const { resetNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
