import { ReactNode, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'src/redux/store';
import { useAuthRefresh } from 'src/hooks/useAuthRefresh';
import { hasValidTokens } from 'src/utils/tokenValidator';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { refreshToken, isRefreshing } = useAuthRefresh();
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  const token = useSelector((state: RootState) => state.auth.token);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getVerifyToken = (): string | null => {
    if (typeof window !== 'undefined') {
      const verifyToken = sessionStorage.getItem('verifyToken');
      return verifyToken;
    }
    return null;
  };

  // Define function to check if both token and verifyToken exist
  const isFullyAuthenticated = (): boolean => {
    return !!(token && getVerifyToken());
  };

  // Initial check for token refresh
  useEffect(() => {
    // If we're already fully authenticated, no need to do anything
    if (isFullyAuthenticated()) {
      console.log('Authentication already complete, skipping refresh');
      return;
    }

    // If we've already tried refreshing, don't try again
    if (hasAttemptedRefresh) {
      return;
    }

    // Check if we have a verifyToken but no token in Redux store
    const verifyToken = getVerifyToken();
    if (verifyToken && !token && !isRefreshing) {
      console.log('Auth provider: Has verifyToken but no token, attempting refresh');
      setHasAttemptedRefresh(true);
      
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        refreshToken().then(success => {
          console.log('Initial token refresh result:', success ? 'successful' : 'failed');
        });
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [token, isRefreshing, hasAttemptedRefresh]);

  // Set up regular token refresh interval
  useEffect(() => {
    // Clean up existing interval if it exists
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    
    if (isFullyAuthenticated()) {
      console.log('Setting up token refresh interval');
      // Refresh token every 14 minutes (assuming 15-minute expiry)
      refreshIntervalRef.current = setInterval(() => {
        console.log('Executing scheduled token refresh');
        refreshToken().then(success => {
          console.log('Scheduled refresh result:', success ? 'successful' : 'failed');
        });
      }, 14 * 60 * 1000);
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [token]);

  // Check for valid tokens on each page load/refresh
  useEffect(() => {
    // If we have a token in Redux but tokens in storage are invalid, try to refresh
    if (token && !hasValidTokens() && !isRefreshing && !hasAttemptedRefresh) {
      console.log('Tokens in storage invalid, attempting refresh');
      setHasAttemptedRefresh(true);
      refreshToken();
    }
  }, []);

  return <>{children}</>;
} 