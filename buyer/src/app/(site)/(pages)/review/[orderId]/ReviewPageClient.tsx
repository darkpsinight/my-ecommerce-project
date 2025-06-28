"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { reviewService, CanReviewOrderResponse } from "@/services/reviews";
import ReviewForm from "@/components/ReviewForm";
import Link from "next/link";

const ReviewPageClient = () => {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { token } = useSelector((state: RootState) => state.authReducer);
  const isAuthenticated = !!token;
  
  const [reviewEligibility, setReviewEligibility] = useState<CanReviewOrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push(`/signin?redirect=${encodeURIComponent(`/review/${orderId}`)}`);
      return;
    }

    checkReviewEligibility();
  }, [isAuthenticated, orderId, router]);

  const checkReviewEligibility = async () => {
    if (!orderId) {
      setError("Invalid order ID");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const response = await reviewService.canUserReviewOrder(orderId);
      setReviewEligibility(response);
    } catch (error: any) {
      console.error("Error checking review eligibility:", error);
      
      if (error.response?.status === 401) {
        router.push(`/signin?redirect=${encodeURIComponent(`/review/${orderId}`)}`);
        return;
      }
      
      if (error.response?.status === 404) {
        setError("Order not found or you don't have permission to review this order.");
      } else {
        setError("Unable to verify review eligibility. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    // Redirect to orders page after successful review submission
    // Use setTimeout to allow the success message to show briefly before redirect
    setTimeout(() => {
      router.push("/orders?reviewSubmitted=true");
    }, 1500);
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-1 pt-56 sm:pt-44 md:pt-32 lg:pt-48 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-1 p-8">
            <div className="animate-pulse">
              {/* Header skeleton */}
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gray-2 rounded-full mr-4"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-2 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-2 rounded w-32"></div>
                </div>
              </div>
              
              {/* Content skeleton */}
              <div className="space-y-4">
                <div className="h-4 bg-gray-2 rounded w-full"></div>
                <div className="h-4 bg-gray-2 rounded w-3/4"></div>
                <div className="h-32 bg-gray-2 rounded w-full"></div>
                <div className="h-10 bg-gray-2 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-gray-1 pt-56 sm:pt-44 md:pt-32 lg:pt-48 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-1 p-8 text-center">
            {/* Error Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-light-6 mb-6">
              <svg
                className="h-8 w-8 text-red"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Unable to Access Review
            </h1>
            <p className="text-gray-600 mb-8">
              {error}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/orders"
                className="flex-1 sm:flex-none sm:px-8 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-colors duration-200"
              >
                View My Orders
              </Link>
              <button
                onClick={checkReviewEligibility}
                className="flex-1 sm:flex-none sm:px-8 flex justify-center py-3 px-4 border border-gray-3 rounded-lg shadow-sm text-sm font-medium text-gray-7 bg-white hover:bg-gray-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // No review eligibility data
  if (!reviewEligibility) {
    return (
      <main className="min-h-screen bg-gray-1 pt-56 sm:pt-44 md:pt-32 lg:pt-48 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-1 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-3 mb-6">
              <svg
                className="h-8 w-8 text-gray-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Review Status Unknown
            </h1>
            <p className="text-gray-600 mb-8">
              Unable to determine review eligibility for this order.
            </p>
            <Link
              href="/orders"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-colors duration-200"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Already reviewed
  if (!reviewEligibility.canReview && reviewEligibility.existingReview) {
    return (
      <main className="min-h-screen bg-gray-1 pt-56 sm:pt-44 md:pt-32 lg:pt-48 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-1 p-8">
            {/* Header */}
            <div className="flex items-center mb-8">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-light-5 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green"
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
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Review Already Submitted
                </h1>
                <p className="text-gray-600">
                  Thank you for sharing your feedback!
                </p>
              </div>
            </div>

            {/* Order Info */}
            {reviewEligibility.order && (
              <div className="mb-8 p-4 bg-gray-1 rounded-lg">
                <h3 className="text-sm font-medium text-gray-7 mb-2">Order Details</h3>
                <div className="text-sm text-gray-6 space-y-1">
                  <p>Order ID: {reviewEligibility.order.externalId.slice(-8).toUpperCase()}</p>
                  <p>Date: {new Date(reviewEligibility.order.createdAt).toLocaleDateString()}</p>
                  <p>Total: {reviewEligibility.order.currency} {reviewEligibility.order.totalAmount}</p>
                </div>
              </div>
            )}

            {/* Existing Review */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-7 mb-4">Your Review</h3>
              <div className="border border-gray-3 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < reviewEligibility.existingReview!.rating
                            ? "text-yellow-400"
                            : "text-gray-3"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-6">
                    {new Date(reviewEligibility.existingReview.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {reviewEligibility.existingReview.comment && (
                  <p className="text-gray-7 leading-relaxed">
                    {reviewEligibility.existingReview.comment}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/orders"
                className="flex-1 sm:flex-none sm:px-8 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-colors duration-200"
              >
                View My Orders
              </Link>
              <Link
                href="/products"
                className="flex-1 sm:flex-none sm:px-8 flex justify-center py-3 px-4 border border-gray-3 rounded-lg shadow-sm text-sm font-medium text-gray-7 bg-white hover:bg-gray-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-colors duration-200"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Cannot review (not eligible)
  if (!reviewEligibility.canReview) {
    return (
      <main className="min-h-screen bg-gray-1 pt-56 sm:pt-44 md:pt-32 lg:pt-48 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-1 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-light-6 mb-6">
              <svg
                className="h-8 w-8 text-yellow"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Review Not Available
            </h1>
            <p className="text-gray-600 mb-8">
              {reviewEligibility.reason || "You are not eligible to review this order."}
            </p>

            <Link
              href="/orders"
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue transition-colors duration-200"
            >
              View My Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Can review - show the form
  return (
    <main className="min-h-screen bg-gray-1 pt-56 sm:pt-44 md:pt-32 lg:pt-48 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-1 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-light-5 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue"
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
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Leave a Review
              </h1>
              <p className="text-gray-600">
                Share your experience with this purchase
              </p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        {reviewEligibility.order && (
          <div className="bg-white rounded-lg shadow-1 p-6">
            <h2 className="text-lg font-semibold text-gray-7 mb-4">Order Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-6">Order ID</span>
                <span className="text-sm text-gray-7">
                  {reviewEligibility.order.externalId.slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-6">Date</span>
                <span className="text-sm text-gray-7">
                  {new Date(reviewEligibility.order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-6">Total</span>
                <span className="text-sm text-gray-7">
                  {reviewEligibility.order.currency} {reviewEligibility.order.totalAmount}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-2">
                <span className="text-sm font-medium text-gray-6 block mb-2">Items</span>
                {reviewEligibility.order.orderItems.map((item, index) => (
                  <div key={index} className="text-sm text-gray-7 mb-1">
                    {item.title} - {item.platform} ({item.region}) × {item.quantity}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Review Form */}
        <ReviewForm 
          orderId={orderId}
          onReviewSubmitted={handleReviewSubmitted}
          isStandalonePage={true}
        />
      </div>
    </main>
  );
};

export default ReviewPageClient;