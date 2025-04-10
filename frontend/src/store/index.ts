import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import threatsReducer from './slices/threatsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    threats: threatsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 