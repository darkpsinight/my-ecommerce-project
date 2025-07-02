'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';
import { getCrossTabAuth } from '@/services/crossTabAuth';
import { syncAuthState } from '@/redux/features/auth-slice';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();
  const { refreshToken, isRefreshing } = useAuthRefresh();
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  const { token, isAuthenticated } = useSelector((state: any) => state.authReducer);

  const getVerifyToken = (): string | null => {
    const crossTabAuth = getCrossTabAuth();
    return crossTabAuth.getVerifyToken();
  };

  // Define function to check if both token and verifyToken exist
  const isFullyAuthenticated = (): boolean => {
    const verifyToken = getVerifyToken();
    return !!(token && verifyToken && isAuthenticated);
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

  // Set up cross-tab authentication synchronization
  useEffect(() => {
    const crossTabAuth = getCrossTabAuth();
    
    const unsubscribe = crossTabAuth.subscribe((authState) => {
      // Sync authentication state from other tabs
      dispatch(syncAuthState({
        token: authState.token,
        isAuthenticated: authState.isAuthenticated,
        lastUpdate: authState.lastUpdate
      }));
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  // Update viewed products service authentication status when token changes
  useEffect(() => {
    const updateViewedProductsAuth = async () => {
      const { updateAuthStatus } = await import('@/services/viewedProducts');
      updateAuthStatus(); // Let it check the current auth status
    };
    
    updateViewedProductsAuth();
  }, [token, isAuthenticated]);

  return <>{children}</>;
} 