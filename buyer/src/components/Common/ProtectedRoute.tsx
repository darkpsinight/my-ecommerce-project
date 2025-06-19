"use client";
import React from "react";
import { useAppSelector } from "@/redux/store";
import { selectAuthToken } from "@/redux/features/auth-slice";
import PageContainer from "./PageContainer";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectMessage?: string;
  redirectButtonText?: string;
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectMessage = "You need to be signed in to access this page.",
  redirectButtonText = "Sign In",
  redirectPath = "/signin",
}) => {
  const token = useAppSelector(selectAuthToken);
  const isAuthenticated = !!token;

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      <PageContainer>
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="text-center">
              <div className="mb-8">
                <svg
                  className="w-20 h-20 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-4">
                Authentication Required
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {redirectMessage}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={redirectPath}
                  className="inline-flex justify-center font-medium text-white bg-blue py-3 px-6 rounded-md ease-out duration-200 hover:bg-blue-dark"
                >
                  {redirectButtonText}
                </a>
                <a
                  href="/signup"
                  className="inline-flex justify-center font-medium text-blue bg-transparent border border-blue py-3 px-6 rounded-md ease-out duration-200 hover:bg-blue hover:text-white"
                >
                  Create Account
                </a>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Don&apos;t have an account? Sign up to access all features.
              </p>
            </div>
          </div>
        </section>
      </PageContainer>
    );
  }

  // If authentication is not required or user is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;