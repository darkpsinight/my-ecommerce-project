import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
}

const initialState: AuthState = {
  token: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthToken: (state, action: PayloadAction<string>) => {
      console.log('Setting auth token:', action.payload); // Debug log
      state.token = action.payload;
    },
    clearAuth: (state) => {
      console.log('Clearing auth state'); // Debug log
      state.token = null;
    }
  }
});

export const { setAuthToken, clearAuth } = authSlice.actions;
export default authSlice.reducer; 