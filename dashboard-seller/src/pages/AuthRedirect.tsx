import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { setAuthToken } from 'src/redux/slices/authSlice';
import { AUTH_API } from 'src/config/api';

interface ValidationResponse {
  statusCode: number;
  message: string;
  token: string;
}

const AuthRedirect = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        toast.error('No authentication token found');
        navigate('/login');
        return;
      }

      try {
        const response = await axios.post<ValidationResponse>(
          AUTH_API.VALIDATE_SELLER_TOKEN,
          { token }
        );

        // Store the token in Redux
        dispatch(setAuthToken(response.data.token));

        // Clear URL params and redirect to dashboard
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        navigate('/');
      } catch (error) {
        console.error('Token validation error:', error);
        toast.error(
          error.response?.data?.message || 'Failed to validate authentication'
        );
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
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
