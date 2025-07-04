import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getCrossTabAuth } from "@/services/crossTabAuth";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  lastUpdate: number;
}

const initialState: AuthState = {
  token: null,
  isAuthenticated: false,
  lastUpdate: 0,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<{ token: string; verifyToken: string; skipCrossTab?: boolean }>) => {
      const timestamp = Date.now();
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.lastUpdate = timestamp;
      
      // Only update cross-tab service if not explicitly skipped (to prevent circular updates)
      if (typeof window !== 'undefined' && !action.payload.skipCrossTab) {
        const crossTabAuth = getCrossTabAuth();
        crossTabAuth.setTokens(action.payload.token, action.payload.verifyToken);
      }
    },
    updateToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      state.lastUpdate = Date.now();
    },
    clearTokens: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.lastUpdate = Date.now();
      
      // Update cross-tab service
      if (typeof window !== 'undefined') {
        const crossTabAuth = getCrossTabAuth();
        crossTabAuth.clearTokens();
      }
    },
    // New action for cross-tab sync
    syncAuthState: (state, action: PayloadAction<{ token: string | null; isAuthenticated: boolean; lastUpdate: number }>) => {
      // Only update if the received state is newer
      if (action.payload.lastUpdate > state.lastUpdate) {
        state.token = action.payload.token;
        state.isAuthenticated = action.payload.isAuthenticated;
        state.lastUpdate = action.payload.lastUpdate;
      }
    },
  },
});

// Selectors
export const selectAuthToken = (state: any) => state.authReducer.token;
export const selectIsAuthenticated = (state: any) => state.authReducer.isAuthenticated;
export const selectAuthLastUpdate = (state: any) => state.authReducer.lastUpdate;

export const { setTokens, updateToken, clearTokens, syncAuthState } = authSlice.actions;
export default authSlice.reducer;