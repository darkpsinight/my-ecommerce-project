'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';
import SellerVerificationWizard from "@/components/SellDigitalCodes/KYC/SellerVerificationWizard";
import PageContainer from "@/components/Common/PageContainer";

export default function KYCPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const authState = useSelector((state: any) => state.authReducer);
  const { token } = authState;
  const [isChecking, setIsChecking] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [hasAttemptedRefresh, setHasAttemptedRefresh] = useState(false);
  
  // Use the auth refresh hook to keep tokens fresh
  const { refreshToken, isRefreshing } = useAuthRefresh();

  // Get verifyToken from sessionStorage
  const getVerifyToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('verifyToken');
    }
    return null;
  };

  // Define a callback function to check auth state
  const checkTokens = useCallback(() => {
    const currentToken = authState.token;
    const currentVerifyToken = getVerifyToken();
    
    return !!(currentToken && currentVerifyToken);
  }, [authState]);

  useEffect(() => {
    // First, check if we already have tokens in Redux store
    if (checkTokens()) {
      console.log("Already authenticated with token");
      setIsChecking(false);
      return;
    }

    // To prevent redirect loops
    if (hasRedirected) {
      return;
    }

    // Skip if we already attempted a refresh
    if (hasAttemptedRefresh) {
      return;
    }

    // Next, try to refresh tokens once
    const checkAuth = async () => {
      console.log("Checking auth state...");
      try {
        setHasAttemptedRefresh(true);
        
        // Try refreshing token to get the latest auth state
        await refreshToken();
        
        // Check immediately after refresh 
        if (checkTokens()) {
          console.log("Authenticated after immediate check");
          setIsChecking(false);
          return;
        }
        
        // If still not authenticated, wait a bit and check again
        // This time we don't call refreshToken again, just check if any other
        // component's refresh succeeded
        setTimeout(() => {
          if (checkTokens()) {
            console.log("Authenticated after delayed check");
            setIsChecking(false);
          } else {
            console.log("Failed to authenticate, redirecting to login");
            setHasRedirected(true);
            router.push('/signin?redirect=/sell-digital-codes/KYC');
          }
        }, 800);
      } catch (error) {
        console.error("Auth check error:", error);
        setHasRedirected(true);
        router.push('/signin?redirect=/sell-digital-codes/KYC');
      }
    };

    // Use a longer timeout for the initial check to let AuthProvider potentially handle it
    const timer = setTimeout(() => {
      if (!isRefreshing && !checkTokens()) {
        checkAuth();
      } else if (checkTokens()) {
        // If tokens are already available, no need to refresh
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [token, router, refreshToken, isRefreshing, hasRedirected, hasAttemptedRefresh, checkTokens]);

  // Show loading state
  if (isChecking) {
    return (
      <PageContainer>
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Verifying your authentication...</p>
        </div>
      </PageContainer>
    );
  }

  // Only render content when authenticated
  return (
    <PageContainer>
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="bg-white rounded-xl shadow-1 px-4 py-10 sm:py-15 lg:py-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark mb-4">
                Seller Verification
              </h1>
              <p className="text-lg text-dark">
                Complete your verification to start selling digital codes on our
                marketplace. This helps us maintain a safe and trusted
                environment for all users.
              </p>
            </div>

            <SellerVerificationWizard />
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
