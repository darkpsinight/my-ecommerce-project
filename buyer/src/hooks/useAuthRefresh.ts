import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTokens } from '@/redux/features/auth-slice';
import { AUTH_API } from '@/config/api';
import { getCrossTabAuth } from '@/services/crossTabAuth';
import { useTabVisibility } from '@/hooks/useTabVisibility';

// Create a debounce mechanism to prevent multiple refreshes
let globalRefreshInProgress = false;
let lastRefreshTimestamp = 0;
const MIN_REFRESH_INTERVAL = 5000; // 5 seconds minimum between refreshes

export const useAuthRefresh = () => {
  const dispatch = useDispatch();
  const { token, isAuthenticated } = useSelector((state: any) => state.authReducer);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getVerifyToken = (): string | null => {
    // Try cross-tab service first, then fallback to sessionStorage
    const crossTabAuth = getCrossTabAuth();
    const verifyToken = crossTabAuth.getVerifyToken();
    
    if (verifyToken) {
      return verifyToken;
    }
    
    // Fallback to direct sessionStorage access
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('verifyToken');
    }
    return null;
  };

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        return cookie.substring(name.length + 1);
      }
    }
    return null;
  };

  const isRefreshAllowed = (): boolean => {
    // Check if global refresh is in progress
    if (globalRefreshInProgress) {
      console.log('Skipping refresh - another refresh is already in progress');
      return false;
    }
    
    // Check if we've refreshed too recently
    const now = Date.now();
    if (now - lastRefreshTimestamp < MIN_REFRESH_INTERVAL) {
      console.log('Skipping refresh - too soon since last refresh');
      return false;
    }
    
    return true;
  };

  const refreshToken = async () => {
    // Don't refresh if already refreshing locally
    if (isRefreshing) {
      console.log('Skipping refresh - local refresh already in progress');
      return false;
    }
    
    // Check global refresh state
    if (!isRefreshAllowed()) {
      return false;
    }
    
    try {
      setIsRefreshing(true);
      globalRefreshInProgress = true;
      lastRefreshTimestamp = Date.now();
      
      // Get verifyToken from sessionStorage
      const verifyToken = getVerifyToken();
      
      // Don't attempt to refresh if we don't have verifyToken
      if (!verifyToken) {
        console.log('Skipping token refresh - no verifyToken available');
        setIsRefreshing(false);
        globalRefreshInProgress = false;
        return false;
      }
      
      console.log('Refreshing token with verifyToken:', verifyToken.substring(0, 5) + '...');
      
      const response = await fetch(AUTH_API.REFRESH_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': verifyToken,
        },
        body: JSON.stringify({}),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.token && data.verifyToken) {
          dispatch(setTokens({
            token: data.token,
            verifyToken: data.verifyToken
          }));
          console.log('Token refreshed successfully');
          return true;
        }
      } else {
        const errorData = await response.json();
        console.error('Token refresh error:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    } finally {
      setIsRefreshing(false);
      globalRefreshInProgress = false;
    }
  };

  // Check if token exists, if not try to refresh
  useEffect(() => {
    if (!token) {
      const verifyToken = getVerifyToken();
      if (verifyToken && isRefreshAllowed()) {
        const timer = setTimeout(() => {
          refreshToken();
        }, 300);
        
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Set up interval to refresh token every 14 minutes (assuming 15-minute token expiry)
  useEffect(() => {
    const verifyToken = getVerifyToken();
    if (token && verifyToken) {
      const interval = setInterval(() => {
        if (isRefreshAllowed()) {
          refreshToken();
        }
      }, 14 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Add tab visibility detection for proactive token refresh
  useTabVisibility({
    onVisible: () => {
      // When tab becomes visible, check if we need to refresh token
      const verifyToken = getVerifyToken();
      if (token && verifyToken && isRefreshAllowed()) {
        // Small delay to ensure everything is ready
        setTimeout(() => {
          refreshToken();
        }, 500);
      }
    },
    onFocus: () => {
      // When window gets focus, also check for token refresh
      const verifyToken = getVerifyToken();
      if (token && verifyToken && isRefreshAllowed()) {
        setTimeout(() => {
          refreshToken();
        }, 300);
      }
    }
  });

  return { refreshToken, isRefreshing };
}; 