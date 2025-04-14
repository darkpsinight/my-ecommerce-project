import { store } from 'src/redux/store';
import { setAuthToken, clearAuth } from 'src/redux/slices/authSlice';
import { encrypt } from 'src/utils/crypto';

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
      
      // Encrypt and store in sessionStorage for browser navigation persistence
      const encryptedToken = encrypt(response.token);
      sessionStorage.setItem('auth_temp_token', encryptedToken);
      
      // Store verifyToken in sessionStorage (also encrypt)
      if (response.verifyToken) {
        const encryptedVerifyToken = encrypt(response.verifyToken);
        sessionStorage.setItem('verifyToken', encryptedVerifyToken);
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
    sessionStorage.removeItem('auth_temp_token');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
}; 