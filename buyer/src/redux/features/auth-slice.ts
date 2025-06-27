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
    updateToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    clearTokens: (state) => {
      state.token = null;
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('verifyToken');
      }
    },
  },
});

// Selectors
export const selectAuthToken = (state: any) => state.authReducer.token;
export const selectIsAuthenticated = (state: any) => !!state.authReducer.token;

export const { setTokens, updateToken, clearTokens } = authSlice.actions;
export default authSlice.reducer;