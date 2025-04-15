import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setAuthToken } from 'src/redux/slices/authSlice';
import { AUTH_API } from 'src/config/api';
import { encrypt } from 'src/utils/crypto';
import { handleLoginResponse } from 'src/utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const isMounted = useRef(true);

  useEffect(() => {
    // Setup cleanup to prevent memory leaks
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const provider = searchParams.get('provider') || 'google';
      const error = searchParams.get('error');

      if (error) {
        if (isMounted.current) {
          setError(`Authentication failed: ${error}`);
          setIsLoading(false);
          toast.error(`Authentication failed: ${error}`);
          setTimeout(() => navigate('/login'), 2000);
        }
        return;
      }

      if (!code) {
        if (isMounted.current) {
          setError('No authorization code found');
          setIsLoading(false);
          toast.error('No authorization code found');
          setTimeout(() => navigate('/login'), 2000);
        }
        return;
      }

      try {
        console.log(`Processing ${provider} OAuth callback...`);
        const response = await axios.post(
          `${API_BASE_URL}/auth/oauth/${provider}`,
          { code },
          { 
            signal: controller.signal,
            withCredentials: true // Important for receiving cookies
          }
        );

        // Only proceed if component is still mounted
        if (!isMounted.current) return;

        console.log('OAuth authentication successful');
        
        // Handle the login response
        const responseData = response.data;
        handleLoginResponse(responseData);

        // Store the token in Redux
        dispatch(setAuthToken(responseData.token));
        
        // Encrypt and store token in sessionStorage for browser navigation
        const encryptedToken = encrypt(responseData.token);
        if (!encryptedToken) {
          console.error('Failed to encrypt access token');
        } else {
          sessionStorage.setItem('auth_temp_token', encryptedToken);
          console.log('Access token stored in sessionStorage (for initial restoration only)');
        }
        
        // Store verifyToken directly in sessionStorage without encryption
        if (responseData.verifyToken) {
          sessionStorage.setItem('verifyToken', responseData.verifyToken);
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
        console.error('OAuth authentication error:', error);
        if (isMounted.current) {
          let errorMessage = 'Failed to authenticate';
          
          // Check for specific error about seller role
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
            // Check if the error is about seller role
            if (errorMessage.toLowerCase().includes('seller')) {
              setError('Only sellers can login with Google');
            } else {
              setError(errorMessage);
            }
          } else {
            setError(errorMessage);
          }
          
          toast.error(errorMessage);
          setTimeout(() => navigate('/login'), 2000);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    handleOAuthCallback();

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
          <p className="mt-4 text-lg">Processing your authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-lg text-red-500">{error}</p>
          <p className="mt-2">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback;
