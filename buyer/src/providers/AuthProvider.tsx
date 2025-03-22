'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { refreshToken } = useAuthRefresh();
  const [initialized, setInitialized] = useState(false);
  const { token, verifyToken } = useSelector((state: any) => state.authReducer);

  useEffect(() => {
    // Check if we have cookies for authentication
    const hasCsrfToken = document.cookie.includes('_csrf=');
    const hasRefreshToken = document.cookie.includes('refresh_token=');
    
    // Only attempt to refresh if:
    // 1. We have cookies but no tokens in Redux, or
    // 2. We have a verifyToken in Redux
    if ((hasRefreshToken && hasCsrfToken && !token) || verifyToken) {
      // Small delay to ensure cookies are fully loaded
      const timer = setTimeout(() => {
        refreshToken();
        setInitialized(true);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setInitialized(true);
    }
  }, [token, verifyToken]);

  return <>{children}</>;
} 