import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'src/redux/store';
import { useAuthRefresh } from 'src/hooks/useAuthRefresh';
import { hasValidTokens } from 'src/utils/tokenValidator';
import SuspenseLoader from './SuspenseLoader';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element => {
  const location = useLocation();
  const token = useSelector((state: RootState) => state.auth.token);
  const { refreshToken, isRefreshing } = useAuthRefresh();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute: Checking authentication...', { 
      hasToken: !!token, 
      isRefreshing,
      hasAttemptedRefresh,
      verifyTokenExists: !!sessionStorage.getItem('verifyToken')
    });
    
    // If we already have a valid token, don't check further
    if (token) {
      console.log('ProtectedRoute: Token exists, proceeding');
      setIsChecking(false);
      return;
    }

    // If no tokens or if tokens are invalid, try to refresh once
    if (!hasAttemptedRefresh && !isRefreshing) {
      console.log('ProtectedRoute: Attempting token refresh');
      setHasAttemptedRefresh(true);
      
      refreshToken().then(success => {
        if (success) {
          console.log('ProtectedRoute: Token refresh successful, continuing');
        } else {
          console.log('ProtectedRoute: Token refresh failed, redirecting to login');
        }
        setIsChecking(false);
      }).catch(error => {
        console.error('ProtectedRoute: Error during refresh:', error);
        setIsChecking(false);
      });
    } else if (hasAttemptedRefresh && !isRefreshing) {
      console.log('ProtectedRoute: Already attempted refresh, skipping');
      setIsChecking(false);
    }
  }, [token, isRefreshing, hasAttemptedRefresh]);

  if (isChecking || isRefreshing) {
    return <SuspenseLoader />;
  }

  // After checking, if we still don't have a token, redirect to login
  if (!token) {
    console.log('ProtectedRoute: No token after checks, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have a token, render the protected content
  return children;
};

export default ProtectedRoute; 