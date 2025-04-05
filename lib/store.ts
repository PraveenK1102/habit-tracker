// lib/store.ts
import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './features/sessionSlice';
import tasksReducer from './features/tasksSlice';

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    tasks: tasksReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
