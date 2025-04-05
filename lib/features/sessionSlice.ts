// features/sessionSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SessionState {
  session: any;
  user: any;
}

const initialState: SessionState = {
  session: null,
  user: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<any>) {
      state.session = action.payload;
    },
    setUser(state, action: PayloadAction<any>) {
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
