import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getCrossTabAuth } from '@/services/crossTabAuth';
import { authRefreshManager, isRefreshing as isGloballyRefreshing } from '@/services/authRefreshManager';

const REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutes
let refreshIntervalId: NodeJS.Timeout | null = null;

export const useAuthRefresh = () => {
  const { token, isAuthenticated } = useSelector((state: any) => state.authReducer);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hookId] = useState(() => `hook-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);

  const getVerifyToken = (): string | null => {
    const crossTabAuth = getCrossTabAuth();
    return crossTabAuth.getVerifyToken();
  };

  const refreshToken = async (): Promise<boolean> => {
    if (isRefreshing) {
      console.log(`[${hookId}] Already refreshing locally`);
      return false;
    }

    setIsRefreshing(true);
    try {
      return await authRefreshManager.refreshToken({ source: hookId });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initial token check - only attempt if no token but have verifyToken
  useEffect(() => {
    if (!token && !isGloballyRefreshing()) {
      const verifyToken = getVerifyToken();
      if (verifyToken) {
        const timer = setTimeout(() => {
          refreshToken();
        }, 2000); // Delay to allow other components to initialize
        
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Set up periodic refresh interval (only one instance globally)
  useEffect(() => {
    const verifyToken = getVerifyToken();
    if (token && verifyToken && !refreshIntervalId) {
      refreshIntervalId = setInterval(() => {
        authRefreshManager.refreshToken({ source: `${hookId}-interval` });
      }, REFRESH_INTERVAL);
      
      return () => {
        if (refreshIntervalId) {
          clearInterval(refreshIntervalId);
          refreshIntervalId = null;
        }
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { refreshToken, isRefreshing };
}; 