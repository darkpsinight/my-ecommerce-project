"use client";

import { useState } from 'react';
import { authApi, SigninData } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setTokens } from '@/redux/features/auth-slice';

interface UseSigninReturn {
  formData: SigninData;
  loading: boolean;
  emailError: string | null;
  passwordError: string | null;
  apiError: {
    message: string;
    hint?: string;
    links?: {
      signup?: string;
      passwordReset?: string;
    };
  } | null;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, recaptchaToken?: string) => Promise<void>;
}

export const useSignin = (): UseSigninReturn => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState<SigninData>({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<UseSigninReturn['apiError']>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing
    if (name === 'email') setEmailError(null);
    if (name === 'password') setPasswordError(null);
    setApiError(null);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!formData.password) {
      setPasswordError('Password is required');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, recaptchaToken?: string) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setApiError(null); // Reset API error on new submission
    
    try {
      const response = await authApi.signin({
        ...formData,
        recaptchaToken
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      // Store the token in Redux store
      if (response.data?.token && response.data?.verifyToken) {
        dispatch(setTokens({
          token: response.data.token,
          verifyToken: response.data.verifyToken
        }));
      }

      // Get the redirect URL from search params or default to home
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect') || '/';
      
      // Redirect to the appropriate page
      router.push(redirectUrl);
    } catch (err: any) {
      const errorResponse = err.response?.data;
      
      if (errorResponse) {
        setApiError({
          message: errorResponse.message || 'Login failed',
          hint: errorResponse.metadata?.hint,
          links: errorResponse.metadata?.links
        });
      } else {
        setApiError({
          message: 'An unexpected error occurred. Please try again later.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    emailError,
    passwordError,
    apiError,
    handleChange,
    handleSubmit,
  };
}; 
