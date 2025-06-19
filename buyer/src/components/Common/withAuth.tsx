"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { selectAuthToken } from "@/redux/features/auth-slice";

interface WithAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * Higher-order component for protecting routes with authentication
 * @param WrappedComponent - The component to wrap with authentication
 * @param options - Configuration options
 * @returns Protected component
 */
const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) => {
  const {
    redirectTo = "/signin",
    requireAuth = true,
  } = options;

  const AuthenticatedComponent: React.FC<P> = (props) => {
    const router = useRouter();
    const token = useAppSelector(selectAuthToken);
    const isAuthenticated = !!token;

    useEffect(() => {
      if (requireAuth && !isAuthenticated) {
        // Get current path to redirect back after login
        const currentPath = window.location.pathname + window.location.search;
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
        router.replace(redirectUrl);
      }
    }, [isAuthenticated, router]);

    // Don't render the component if authentication is required but user is not authenticated
    if (requireAuth && !isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  // Set display name for better debugging
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthenticatedComponent;
};

export default withAuth;