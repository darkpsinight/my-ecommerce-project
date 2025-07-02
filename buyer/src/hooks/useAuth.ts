import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/redux/features/auth-slice';
import { useAuthRefresh } from './useAuthRefresh';

interface UseAuthReturn {
  isAuthenticated: boolean;
  loading: boolean;
  token: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { token } = useSelector((state: any) => state.authReducer);
  const { isRefreshing } = useAuthRefresh();

  const getVerifyToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('verifyToken');
    }
    return null;
  };

  // Check if user is fully authenticated (has both tokens)
  const isFullyAuthenticated = !!(token && getVerifyToken());

  return {
    isAuthenticated: isFullyAuthenticated,
    loading: isRefreshing,
    token
  };
};