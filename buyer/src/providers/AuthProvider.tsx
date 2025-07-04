'use client';

import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getCrossTabAuth } from '@/services/crossTabAuth';
import { syncAuthState } from '@/redux/features/auth-slice';
import { authRefreshManager } from '@/services/authRefreshManager';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  const { token, isAuthenticated } = useSelector((state: any) => state.authReducer);
  
  // Initialize the auth refresh hook (this will handle the periodic refresh and tab visibility)
  useAuthRefresh();

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
    if (!token && getVerifyToken() && !authRefreshManager.isCurrentlyRefreshing()) {
      setHasAttemptedRefresh(true);
      
      const timer = setTimeout(() => {
        authRefreshManager.refreshToken({ source: 'AuthProvider' });
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, hasAttemptedRefresh]);

  // Set up cross-tab authentication synchronization
  useEffect(() => {
    const crossTabAuth = getCrossTabAuth();
    
    const unsubscribe = crossTabAuth.subscribe((authState) => {
      if (authState.lastUpdate !== Date.now()) {
        dispatch(syncAuthState({
          token: authState.token,
          isAuthenticated: authState.isAuthenticated,
          lastUpdate: authState.lastUpdate
        }));
      }
    });

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