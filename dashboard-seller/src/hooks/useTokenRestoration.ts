import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthToken } from 'src/redux/slices/authSlice';
import { RootState } from 'src/redux/store';
import { isTokenExpired } from 'src/utils/tokenValidator';
import { decrypt } from 'src/utils/crypto';

export const useTokenRestoration = () => {
  const dispatch = useDispatch();
  const currentToken = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    // Only attempt to restore the token from sessionStorage if
    // there's no token in Redux already
    if (!currentToken) {
      console.log('TokenRestoration: No token in Redux, checking sessionStorage');
      try {
        const encryptedToken = sessionStorage.getItem('auth_temp_token');
        
        if (encryptedToken) {
          // Decrypt the token
          const token = decrypt(encryptedToken);
          
          if (token) {
            // Check if token is valid before using it
            if (!isTokenExpired(token)) {
              console.log('TokenRestoration: Restoring valid token from sessionStorage');
              dispatch(setAuthToken(token));
              console.log('TokenRestoration: verifyToken status:', !!sessionStorage.getItem('verifyToken'));
              
              // Clean up auth_temp_token after successful restoration
              // This is appropriate since it's only needed for initial restoration
              console.log('TokenRestoration: Removing auth_temp_token after successful restoration');
              sessionStorage.removeItem('auth_temp_token');
            } else {
              // Clean up expired token
              console.log('TokenRestoration: Removing expired token from sessionStorage');
              sessionStorage.removeItem('auth_temp_token');
            }
          } else {
            console.log('TokenRestoration: Decryption failed or empty token');
          }
        } else {
          console.log('TokenRestoration: No token found in sessionStorage');
        }
      } catch (error) {
        console.error('TokenRestoration: Error restoring token:', error);
        // Clean up possibly corrupted token
        sessionStorage.removeItem('auth_temp_token');
      }
    } else {
      console.log('TokenRestoration: Token already exists in Redux, skipping restoration');
    }
  }, [currentToken]);
}; 