'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectIfAuthenticated?: boolean;
  redirectTo?: string;
}

/**
 * AuthGuard component that handles route protection
 * @param children - Child components to render
 * @param redirectIfAuthenticated - If true, redirects authenticated users (for signin/signup pages)
 * @param redirectTo - Where to redirect (defaults to '/' for signin/signup pages)
 */
export default function AuthGuard({ 
  children, 
  redirectIfAuthenticated = false,
  redirectTo = '/'
}: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Don't do anything while loading authentication state
    if (loading || isRedirecting) {
      return;
    }

    // If this is a signin/signup page and user is authenticated, redirect away
    if (redirectIfAuthenticated && isAuthenticated) {
      setIsRedirecting(true);
      router.replace(redirectTo);
      return;
    }

    // If this is a protected page and user is not authenticated, redirect to signin
    if (!redirectIfAuthenticated && !isAuthenticated) {
      setIsRedirecting(true);
      router.replace('/signin');
      return;
    }
  }, [isAuthenticated, loading, redirectIfAuthenticated, redirectTo, router, isRedirecting]);

  // Show loading while checking authentication or redirecting
  if (loading || isRedirecting) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-default mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? 'Checking authentication...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    );
  }

  // For signin/signup pages: don't render if authenticated (will redirect)
  if (redirectIfAuthenticated && isAuthenticated) {
    return null;
  }

  // For protected pages: don't render if not authenticated (will redirect)
  if (!redirectIfAuthenticated && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}