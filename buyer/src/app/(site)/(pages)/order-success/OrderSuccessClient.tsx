"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { reviewService } from "@/services/reviews";

const OrderSuccessClient = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [mounted, setMounted] = useState(false);
  const [canReview, setCanReview] = useState<boolean | null>(null);
  const [isCheckingReview, setIsCheckingReview] = useState(false);
  const { token } = useSelector((state: RootState) => state.authReducer);

  useEffect(() => {
    setMounted(true);
    console.log('🚀 OrderSuccess mounted:', { token: !!token, orderId, canReview });
    // Check review eligibility if user is authenticated
    if (token && orderId) {
      checkReviewEligibility();
    } else {
      console.log('⚠️ Cannot check review eligibility:', { hasToken: !!token, hasOrderId: !!orderId });
    }
  }, [token, orderId]);

  const checkReviewEligibility = async () => {
    if (!orderId) return;
    
    try {
      setIsCheckingReview(true);
      console.log('🔍 Checking review eligibility for order:', orderId);
      const response = await reviewService.canUserReviewOrder(orderId);
      console.log('✅ Review eligibility response:', response);
      setCanReview(response.canReview);
    } catch (error) {
      console.error('❌ Error checking review eligibility:', error);
      setCanReview(false);
    } finally {
      setIsCheckingReview(false);
    }
  };

  const handleLeaveReview = () => {
    if (orderId) {
      router.push(`/review/${orderId}`);
    }
  };

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <main>
      <div className="min-h-screen bg-gray-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success Message Section */}
          <div className="bg-white rounded-lg shadow-1 p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-light-5 mb-6">
              <svg
                className="h-8 w-8 text-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Successful!
            </h1>
            <p className="text-gray-600 mb-2">
              Your digital codes have been delivered instantly to your account.
            </p>
            {orderId && (
              <p className="text-sm text-gray-500 mb-8">
                Order ID: {orderId.slice(-8).toUpperCase()}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/orders"
                className="flex-1 sm:flex-none sm:px-8 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-colors duration-200"
              >
                View My Orders
              </a>
              <a
                href="/products"
                className="flex-1 sm:flex-none sm:px-8 flex justify-center py-3 px-4 border border-gray-3 rounded-lg shadow-sm text-sm font-medium text-gray-7 bg-white hover:bg-gray-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-colors duration-200"
              >
                Continue Shopping
              </a>
            </div>

            {/* Debug Info - Remove in production */}
            <div className="mt-6 p-4 bg-gray-1 rounded-lg text-xs text-gray-6">
              <strong>Debug Info:</strong><br/>
              • User logged in: {token ? '✅ Yes' : '❌ No'}<br/>
              • Order ID: {orderId || '❌ Missing'}<br/>
              • Can review: {canReview === null ? '🔄 Checking...' : canReview ? '✅ Yes' : '❌ No'}<br/>
              • Show button: {token && canReview ? '✅ Yes' : '❌ No'}
            </div>

            {/* Leave Review Button */}
            {token && canReview && (
              <div className="mt-6 pt-6 border-t border-gray-2">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <svg
                      className="w-5 h-5 text-blue mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-gray-7">
                      Share Your Experience
                    </span>
                  </div>
                  <p className="text-sm text-gray-6 mb-4">
                    Help other buyers by leaving a review of your purchase
                  </p>
                  <button
                    onClick={handleLeaveReview}
                    disabled={isCheckingReview}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green hover:bg-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCheckingReview ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Checking...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                        Leave Review
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="mt-8 p-4 bg-blue-light-5 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-light-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-dark">
                    Important Information
                  </h3>
                  <div className="mt-2 text-sm text-blue">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Your codes are delivered instantly</li>
                      <li>Check expiration dates for each code</li>
                      <li>Contact support if you have any issues</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </main>
  );
};

export default OrderSuccessClient;
