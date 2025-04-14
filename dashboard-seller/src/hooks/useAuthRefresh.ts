import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthToken } from 'src/redux/slices/authSlice';
import { AUTH_API } from 'src/config/api';
import { RootState } from 'src/redux/store';
import { encrypt } from 'src/utils/crypto';

// Create a debounce mechanism to prevent multiple refreshes
let globalRefreshInProgress = false;
let lastRefreshTimestamp = 0;
const MIN_REFRESH_INTERVAL = 5000; // 5 seconds minimum between refreshes

// Interface for refresh response
interface RefreshResponse {
  token: string;
  verifyToken: string;
  statusCode?: number;
  message?: string;
}

export const useAuthRefresh = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getVerifyToken = (): string | null => {
    try {
      if (typeof window !== 'undefined') {
        // Get the verifyToken directly from sessionStorage without encryption
        const verifyToken = sessionStorage.getItem('verifyToken');
        if (!verifyToken) {
          console.log('No verifyToken found in sessionStorage');
          return null;
        }
        
        console.log('Successfully retrieved verifyToken');
        return verifyToken;
      }
    } catch (error) {
      console.error('Error getting verifyToken:', error);
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

  const refreshToken = async (): Promise<boolean> => {
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
      
      // Only log a portion of the token for security
      const tokenPreview = verifyToken.length > 5 
        ? verifyToken.substring(0, 5) + '...' 
        : '...';
      console.log('Refreshing token with verifyToken:', tokenPreview);
      
      // Prepare API URL
      const apiUrl = AUTH_API.REFRESH_TOKEN;
      console.log('Refresh URL:', apiUrl);

      if (!apiUrl) {
        console.error('Invalid refresh token URL');
        setIsRefreshing(false);
        globalRefreshInProgress = false;
        return false;
      }
      
      try {
        console.log('Making refresh request...');
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': verifyToken,
          },
          body: JSON.stringify({}),
          credentials: 'include',
        });

        console.log('Refresh response status:', response.status);

        if (!response.ok) {
          console.error('Token refresh failed with status:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Refresh failed with status ${response.status}`);
        }

        const data: RefreshResponse = await response.json();
        console.log('Refresh response received');

        if (data.token && data.verifyToken) {
          console.log('Token refresh successful');
          
          // Store token in Redux only
          dispatch(setAuthToken(data.token));
          
          // Store verifyToken directly in sessionStorage without encryption
          sessionStorage.setItem('verifyToken', data.verifyToken);
          
          // Don't update auth_temp_token as it's only for initial browser navigation
          // and should not be updated during refresh
          
          console.log('Token refreshed successfully');
          return true;
        } else {
          console.error('Token refresh error: Invalid response data');
          return false;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
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

  // Automatic token refresh on a timer
  useEffect(() => {
    // Only set up interval if we have both token and verifyToken
    if (token && getVerifyToken()) {
      console.log('Setting up automatic token refresh interval');
      
      // Refresh token every 14 minutes (assuming 15-minute token expiry)
      const refreshInterval = setInterval(() => {
        console.log('Automatic token refresh triggered');
        refreshToken();
      }, 14 * 60 * 1000); // 14 minutes
      
      return () => {
        console.log('Clearing refresh interval');
        clearInterval(refreshInterval);
      };
    }
  }, [token]);

  // Try to refresh token on app initialization if we have a verifyToken
  useEffect(() => {
    const verifyToken = getVerifyToken();
    
    // Check if we need to refresh (no token in Redux but verifyToken exists)
    if (!token && verifyToken && isRefreshAllowed()) {
      console.log('No token in Redux store but verifyToken exists - attempting refresh');
      const timer = setTimeout(() => {
        refreshToken();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [token]);

  return { refreshToken, isRefreshing };
}; 