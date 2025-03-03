"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface UseChangePasswordReturn {
  formData: {
    password: string;
    confirmPassword: string;
  };
  loading: boolean;
  passwordError: string | null;
  confirmPasswordError: string | null;
  apiError: {
    message: string;
    hint?: string;
  } | null;
  success: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export const useChangePassword = (): UseChangePasswordReturn => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<UseChangePasswordReturn['apiError']>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'password') setPasswordError(null);
    if (name === 'confirmPassword') setConfirmPasswordError(null);
    setApiError(null);
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!token) {
      setApiError({
        message: 'Invalid or missing reset token',
        hint: 'Please use the reset link from your email'
      });
      isValid = false;
    }

    // Password validation
    if (formData.password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      isValid = false;
    } else if (!/[A-Z]/.test(formData.password)) {
      setPasswordError('Password must contain at least one uppercase letter');
      isValid = false;
    } else if (!/[a-z]/.test(formData.password)) {
      setPasswordError('Password must contain at least one lowercase letter');
      isValid = false;
    } else if (!/[0-9]/.test(formData.password)) {
      setPasswordError('Password must contain at least one number');
      isValid = false;
    } else if (!/[!@#$%^&*]/.test(formData.password)) {
      setPasswordError('Password must contain at least one special character (!@#$%^&*)');
      isValid = false;
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/auth/reset-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (!data.success) {
        setApiError({
          message: data.message || 'Password reset failed',
          hint: data.metadata?.hint
        });
        return;
      }

      setSuccess(true);
      setFormData({ password: '', confirmPassword: '' });
    } catch (err: any) {
      const errorResponse = err.response?.data;
      
      if (errorResponse) {
        setApiError({
          message: errorResponse.message || 'Password reset failed',
          hint: errorResponse.metadata?.hint
        });
      } else {
        setApiError({
          message: err.message || 'An unexpected error occurred. Please try again later.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    passwordError,
    confirmPasswordError,
    apiError,
    success,
    handleChange,
    handleSubmit,
  };
};