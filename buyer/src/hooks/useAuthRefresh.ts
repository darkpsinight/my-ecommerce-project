import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTokens } from '@/redux/features/auth-slice';
import { AUTH_API } from '@/config/api';

export const useAuthRefresh = () => {
  const dispatch = useDispatch();
  const { token, verifyToken } = useSelector((state: any) => state.authReducer);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const refreshToken = async () => {
    // Don't refresh if already refreshing
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      
      // Get CSRF token from cookies or use verifyToken from Redux
      const csrfToken = getCookie('_csrf') || verifyToken || '';
      const refreshTokenValue = getCookie('refresh_token');
      
      // Don't attempt to refresh if we don't have tokens
      if (!csrfToken || !refreshTokenValue) {
        console.log('Skipping token refresh - no tokens available');
        setIsRefreshing(false);
        return;
      }
      
      console.log('Refreshing token with CSRF:', csrfToken.substring(0, 5) + '...');
      
      const response = await fetch(AUTH_API.REFRESH_TOKEN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
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
    }
  };

  useEffect(() => {
    // Only attempt to refresh if we have cookies but no tokens
    const csrfCookie = getCookie('_csrf');
    const refreshCookie = getCookie('refresh_token');
    
    if ((csrfCookie || refreshCookie) && (!token || !verifyToken)) {
      // Small delay to ensure cookies are loaded
      const timer = setTimeout(() => {
        refreshToken();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Set up interval to refresh token every 14 minutes (assuming 15-minute token expiry)
  useEffect(() => {
    if (token && verifyToken) {
      const interval = setInterval(refreshToken, 14 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token, verifyToken]);

  return { refreshToken, isRefreshing };
}; 