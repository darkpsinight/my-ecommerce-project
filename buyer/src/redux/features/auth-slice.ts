import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  token: string | null;
  verifyToken: string | null;
}

const initialState: AuthState = {
  token: null,
  verifyToken: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<{ token: string; verifyToken: string }>) => {
      state.token = action.payload.token;
      state.verifyToken = action.payload.verifyToken;
    },
    clearTokens: (state) => {
      state.token = null;
      state.verifyToken = null;
    },
  },
});

export const { setTokens, clearTokens } = authSlice.actions;
export default authSlice.reducer;