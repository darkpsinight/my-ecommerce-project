import { store } from 'src/redux/store';
import { setAuthToken, clearAuth } from 'src/redux/slices/authSlice';

interface LoginResponse {
  statusCode: number;
  message: string;
  success: boolean;
  token: string;
  verifyToken: string;
  emailSuccess: boolean;
  emailMessage: string;
}

export const handleLoginResponse = (response: LoginResponse) => {
  console.log('Login response received:', response); // Debug log
  if (response.success && response.token) {
    try {
      // Store token in Redux
      store.dispatch(setAuthToken(response.token));
      console.log('Token dispatched to Redux'); // Debug log
      
      // Store verifyToken in sessionStorage
      if (response.verifyToken) {
        sessionStorage.setItem('verifyToken', response.verifyToken);
        console.log('Verify token stored in sessionStorage'); // Debug log
      }
    } catch (error) {
      console.error('Error handling login response:', error);
    }
  }
};

export const clearAuthData = () => {
  try {
    // Clear Redux auth state using clearAuth action
    store.dispatch(clearAuth());
    
    // Clear sessionStorage
    sessionStorage.removeItem('verifyToken');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}; 