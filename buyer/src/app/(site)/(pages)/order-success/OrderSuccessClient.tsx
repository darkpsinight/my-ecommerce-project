"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReviewForm from "../../../../components/ReviewForm";

const OrderSuccessClient = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

          {/* Review Section */}
          {orderId && (
            <ReviewForm 
              orderId={orderId}
              onReviewSubmitted={() => {
                // Optional: Show a success message or refresh data
                console.log('Review submitted successfully');
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default OrderSuccessClient;
