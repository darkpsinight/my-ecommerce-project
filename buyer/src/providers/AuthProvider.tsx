'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { refreshToken, isRefreshing } = useAuthRefresh();
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  const { token } = useSelector((state: any) => state.authReducer);

  const getVerifyToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('verifyToken');
    }
    return null;
  };

  // Define function to check if both token and verifyToken exist
  const isFullyAuthenticated = (): boolean => {
    const verifyToken = getVerifyToken();
    return !!(token && verifyToken);
  };

  useEffect(() => {
    // If we're already fully authenticated, no need to do anything
    if (isFullyAuthenticated()) {
      return;
    }

    // If we've already tried refreshing, don't try again
    if (hasAttemptedRefresh) {
      return;
    }

    // Only attempt to refresh if we have verifyToken but no token
    if (!token && getVerifyToken() && !isRefreshing) {
      setHasAttemptedRefresh(true);
      
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        refreshToken();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isRefreshing, hasAttemptedRefresh]);

  return <>{children}</>;
} 