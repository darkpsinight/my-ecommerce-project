"use client";

import { useState } from 'react';
import { authApi } from '@/services/auth';

interface UseForgotPasswordReturn {
  formData: {
    email: string;
  };
  loading: boolean;
  emailError: string | null;
  apiError: {
    message: string;
    hint?: string;
  } | null;
  success: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export const useForgotPassword = (): UseForgotPasswordReturn => {
  const [formData, setFormData] = useState({
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<UseForgotPasswordReturn['apiError']>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'email') setEmailError(null);
    setApiError(null);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setApiError(null);
    setSuccess(false);
    
    try {
      const response = await authApi.forgotPassword(formData.email);

      if (!response.success) {
        throw new Error(response.message);
      }

      setSuccess(true);
    } catch (err: any) {
      const errorResponse = err.response?.data;
      
      if (errorResponse) {
        setApiError({
          message: errorResponse.message || 'Password reset request failed',
          hint: errorResponse.metadata?.hint
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
    apiError,
    success,
    handleChange,
    handleSubmit,
  };
};