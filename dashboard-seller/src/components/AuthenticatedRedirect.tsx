import React, { ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

interface AuthenticatedRedirectProps {
  children: ReactNode;
}

interface LocationState {
  from?: {
    pathname: string;
  };
}

const AuthenticatedRedirect: React.FC<AuthenticatedRedirectProps> = ({ children }) => {
  const token = useSelector((state: any) => state.auth.token);
  const location = useLocation();
  const locationState = location.state as LocationState;

  if (token) {
    const from = locationState?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default AuthenticatedRedirect;
