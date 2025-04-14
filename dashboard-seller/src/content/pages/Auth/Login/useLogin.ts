import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, LoginError } from '../../../../services/api/auth';
import { handleLoginResponse } from 'src/utils/auth';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email: string;
  password: string;
}

export const useLogin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginErrorHint, setLoginErrorHint] = useState('');
  const [loginErrorLink, setLoginErrorLink] = useState('');
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({
    email: '',
    password: ''
  });

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const validateForm = (formData: LoginFormData): boolean => {
    const errors: LoginFormErrors = {
      email: '',
      password: ''
    };

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setFormErrors(errors);
    return !Object.values(errors).some(error => error !== '');
  };

  const handleLogin = async (formData: LoginFormData) => {
    if (!validateForm(formData)) {
      return;
    }

    setIsLoading(true);
    setLoginError('');
    setLoginErrorHint('');
    setLoginErrorLink('');

    try {
      const response = await authService.login(formData);
      console.log('Login response:', response); // Debug log
      
      // Handle the response with our Redux auth handler
      handleLoginResponse(response);
      
      if (response.success) {
        navigate('/overview');
      }
    } catch (error) {
      const loginError = error as LoginError;
      if (isMounted.current) {
        setLoginError(loginError.message);
        setLoginErrorHint(loginError.metadata?.hint || '');
        setLoginErrorLink(loginError.metadata?.links?.signin || '');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await authService.googleLogin();
      // Handle the response with our Redux auth handler
      handleLoginResponse(response);
      
      if (response.success) {
        navigate('/overview');
      }
    } catch (error) {
      if (isMounted.current) {
        setLoginError('Google login is not implemented yet.');
      }
    }
  };

  return {
    isLoading,
    loginError,
    loginErrorHint,
    loginErrorLink,
    formErrors,
    handleLogin,
    handleGoogleLogin
  };
};