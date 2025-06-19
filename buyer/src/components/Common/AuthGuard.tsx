"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store";
import { selectAuthToken } from "@/redux/features/auth-slice";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * AuthGuard component for protecting routes
 * Can be used to wrap entire pages or sections that require authentication
 */
const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo = "/signin",
  fallback,
}) => {
  const router = useRouter();
  const token = useAppSelector(selectAuthToken);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (requireAuth && !token) {
        // Get current path to redirect back after login
        const currentPath = window.location.pathname + window.location.search;
        const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
        router.replace(redirectUrl);
        return;
      }
      setIsChecking(false);
    };

    // Small delay to avoid flashing
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [token, requireAuth, redirectTo, router]);

  // Show fallback while checking auth
  if (isChecking) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      )
    );
  }

  // If auth is required but user is not authenticated, don't render children
  // (they should have been redirected by now)
  if (requireAuth && !token) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;