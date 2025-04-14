import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setAuthToken } from 'src/redux/slices/authSlice';
import { AUTH_API } from 'src/config/api';
import { encrypt } from 'src/utils/crypto';

interface ValidationResponse {
  statusCode: number;
  message: string;
  token: string;
  verifyToken: string;
}

const AuthRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    // Setup cleanup to prevent memory leaks
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    
    const validateToken = async () => {
      const token = searchParams.get('token');
      // Get verifyToken from URL if present and decode it
      const encodedVerifyToken = searchParams.get('verifyToken');
      let verifyToken = null;
      
      // Safely decode the verifyToken if it exists
      if (encodedVerifyToken) {
        try {
          verifyToken = decodeURIComponent(encodedVerifyToken);
          console.log('Decoded verifyToken from URL params');
        } catch (e) {
          console.error('Failed to decode verifyToken from URL:', e);
          verifyToken = encodedVerifyToken; // Use as-is if decoding fails
        }
      }

      if (!token) {
        if (isMounted.current) {
          toast.error('No authentication token found');
          navigate('/login');
        }
        return;
      }

      try {
        console.log('Validating seller token...');
        const response = await axios.post<ValidationResponse>(
          AUTH_API.VALIDATE_SELLER_TOKEN,
          { token },
          { signal: controller.signal }
        );

        // Only proceed if component is still mounted
        if (!isMounted.current) return;

        console.log('Token validation successful');
        
        // Store the token in Redux
        dispatch(setAuthToken(response.data.token));
        
        // Encrypt and store token in sessionStorage for browser navigation
        const encryptedToken = encrypt(response.data.token);
        if (!encryptedToken) {
          console.error('Failed to encrypt access token');
        } else {
          sessionStorage.setItem('auth_temp_token', encryptedToken);
          console.log('Access token stored in sessionStorage (for initial restoration only)');
        }
        
        // If verifyToken was passed from buyer app, use that
        // Otherwise use the one from the validation response
        const finalVerifyToken = verifyToken || response.data.verifyToken;
        
        if (!finalVerifyToken) {
          console.error('No verifyToken available after validation');
        } else {
          // Log the raw verifyToken for debugging (only part of it for security)
          const tokenPreview = finalVerifyToken.length > 5 
            ? finalVerifyToken.substring(0, 5) + '...' 
            : '...';
          console.log('Using verifyToken:', tokenPreview);
          
          // Store verifyToken directly in sessionStorage without encryption
          sessionStorage.setItem('verifyToken', finalVerifyToken);
          console.log('VerifyToken stored in sessionStorage');
        }

        // Clear URL params and redirect to dashboard
        if (isMounted.current) {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
          navigate('/');
        }
      } catch (error) {
        console.error('Token validation error:', error);
        if (isMounted.current) {
          toast.error(
            error.response?.data?.message || 'Failed to validate authentication'
          );
          navigate('/login');
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    validateToken();

    // Cleanup function to abort any ongoing requests when unmounted
    return () => {
      controller.abort();
    };
  }, [searchParams, navigate, dispatch]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-lg">Validating your authentication...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthRedirect;
