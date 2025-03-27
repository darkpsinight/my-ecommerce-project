import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
}

const initialState: AuthState = {
  token: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<{ token: string; verifyToken: string }>) => {
      state.token = action.payload.token;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('verifyToken', action.payload.verifyToken);
      }
    },
    clearTokens: (state) => {
      state.token = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('verifyToken');
      }
    },
  },
});

export const { setTokens, clearTokens } = authSlice.actions;
export default authSlice.reducer;