// features/sessionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  email?: string;
  [key: string]: any;
}

interface Session {
  user?: User;
  access_token?: string;
  [key: string]: any;
}

interface SessionState {
  session: Session | null;
  user: User | null;
}

const initialState: SessionState = {
  session: null,
  user: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
    },
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
    },
    clearSession(state) {
      state.session = null;
      state.user = null;
    },
  },
});

export const { setSession, setUser, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
