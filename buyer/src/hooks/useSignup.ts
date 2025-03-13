"use client";
import { useState } from 'react';
import { authApi, SignupData } from '@/services/auth';
import { useRouter } from 'next/navigation';

interface SignupForm extends SignupData {
  confirmPassword: string;
}

interface UseSignupReturn {
  formData: SignupForm;
  loading: boolean;
  nameError: string | null;
  emailError: string | null;
  passwordError: string | null;
  confirmPasswordError: string | null;
  apiError: {
    message: string;
    hint?: string;
    links?: {
      login?: string;
      passwordReset?: string;
    };
  } | null;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>, recaptchaToken?: string) => Promise<void>;
}

export const useSignup = (): UseSignupReturn => {
  const router = useRouter();
  const [formData, setFormData] = useState<SignupForm>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<UseSignupReturn['apiError']>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing
    if (name === 'name') setNameError(null);
    if (name === 'email') setEmailError(null);
    if (name === 'password') setPasswordError(null);
    if (name === 'confirmPassword') setConfirmPasswordError(null);
  };

  const validatePassword = (password: string): { isValid: boolean; error: string | null } => {
    // Check requirements in sequence
    if (password.length < 12) {
      return {
        isValid: false,
        error: 'Password must be at least 12 characters long'
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one uppercase letter'
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one lowercase letter'
      };
    }

    if (!/\d/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one number'
      };
    }

    if (!/[!@#$%^&*()_+\-={}[\]:";',.?~`]/.test(password)) {
      return {
        isValid: false,
        error: 'Password must contain at least one special character'
      };
    }

    if (/[<>[\]{}|]/.test(password)) {
      return {
        isValid: false,
        error: 'Password contains invalid characters (<>[]{}|)'
      };
    }

    return {
      isValid: true,
      error: null
    };
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!formData.name) {
      setNameError('Full name is required');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error);
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
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
      const { confirmPassword, ...signupData } = formData;
      const response = await authApi.signup({
        ...signupData,
        recaptchaToken
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      // Store the token if needed
      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }

      router.push('/signin?registered=true');
    } catch (err: any) {
      const errorResponse = err.response?.data;
      
      if (errorResponse) {
        setApiError({
          message: errorResponse.message || 'Registration failed',
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
    nameError,
    emailError,
    passwordError,
    confirmPasswordError,
    apiError,
    handleChange,
    handleSubmit,
  };
}; 