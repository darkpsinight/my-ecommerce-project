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
    // Check review eligibility if user is authenticated
    if (token && orderId) {
      checkReviewEligibility();
    }
  }, [token, orderId]);

  const checkReviewEligibility = async () => {
    if (!orderId) return;
    
    try {
      setIsCheckingReview(true);
      const response = await reviewService.canUserReviewOrder(orderId);
      setCanReview(response.canReview);
    } catch (error) {
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
      {/* Header spacing - extra padding for mobile screens */}
      <div className="pt-45 sm:pt-30 md:pt-24 lg:pt-35"></div>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-1 via-blue-light-5 to-purple-light/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Message Section */}
          <div className="bg-white rounded-2xl shadow-2 border border-gray-2 overflow-hidden">
            
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-green to-green-light px-8 py-10 text-center">
              {/* Success Icon with animation effect */}
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-2 mb-6 transform transition-transform duration-300 hover:scale-110">
                <svg
                  className="h-10 w-10 text-green animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl font-bold text-white mb-4">
                Order Successful!
              </h1>
              <p className="text-green-light-5 text-lg mb-2">
                Your digital codes have been delivered instantly to your account.
              </p>
              {orderId && (
                <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full">
                  <span className="text-sm text-white/90 font-medium">
                    Order ID: {orderId.slice(-8).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="p-8 space-y-8">
              {/* Leave Review Section - Moved above buttons */}
              {token && canReview && (
                <div className="bg-gradient-to-r from-blue-light-5 to-purple-light/20 rounded-xl p-4 sm:p-6 border border-blue-light-4">
                  <div className="text-center">
                    {/* Mobile-optimized header - stacked on small screens, side-by-side on larger */}
                    <div className="flex flex-col sm:flex-row items-center justify-center mb-5 sm:mb-4">
                      <div className="flex items-center justify-center h-14 w-14 sm:h-12 sm:w-12 rounded-full bg-blue-light-4 mb-3 sm:mb-0 sm:mr-3">
                        <svg
                          className="w-7 h-7 sm:w-6 sm:h-6 text-blue"
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
                      </div>
                      <div className="text-center sm:text-left">
                        <h3 className="text-xl sm:text-lg font-semibold text-gray-7 mb-1">
                          Share Your Experience
                        </h3>
                        <p className="text-sm sm:text-sm text-gray-6">
                          Help other buyers by leaving a review
                        </p>
                      </div>
                    </div>
                    {/* Mobile-optimized button with full width on small screens */}
                    <button
                      onClick={handleLeaveReview}
                      disabled={isCheckingReview}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-4 sm:py-3 border border-transparent text-base sm:text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green to-green-light hover:from-green-dark hover:to-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-2"
                    >
                      {isCheckingReview ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Checking...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 mr-2"
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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/library"
                  className="group flex-1 sm:flex-none sm:px-8 flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-2 text-sm font-semibold text-white bg-gradient-to-r from-blue to-blue-light hover:from-blue-dark hover:to-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  View My Purchased Codes
                </a>
                <a
                  href="/products"
                  className="group flex-1 sm:flex-none sm:px-8 flex justify-center items-center py-4 px-6 border border-gray-3 rounded-xl shadow-1 text-sm font-semibold text-gray-7 bg-white hover:bg-gray-1 hover:border-gray-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Continue Shopping
                </a>
              </div>

              {/* Additional Info */}
              <div className="bg-gradient-to-r from-blue-light-5 to-teal-light/10 rounded-xl p-6 border border-blue-light-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-light-4">
                      <svg
                        className="h-6 w-6 text-blue"
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
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-blue-dark mb-3">
                      Important Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-blue">
                        <span className="text-green mr-2">●</span>
                        Your codes are delivered instantly to your library
                      </div>
                      <div className="flex items-center text-sm text-blue">
                        <span className="text-yellow mr-2">●</span>
                        Check expiration dates for each code
                      </div>
                      <div className="flex items-center text-sm text-blue">
                        <span className="text-purple mr-2">●</span>
                        Contact support if you have any issues
                      </div>
                    </div>
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
