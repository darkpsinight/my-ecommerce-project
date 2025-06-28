"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface ReviewButtonProps {
  orderId: string;
  canReview: boolean | null;
  isChecking: boolean;
  hasExistingReview: boolean;
  className?: string;
}

const ReviewButton: React.FC<ReviewButtonProps> = ({ 
  orderId, 
  canReview, 
  isChecking, 
  hasExistingReview, 
  className = "" 
}) => {
  const router = useRouter();

  const handleReviewClick = () => {
    router.push(`/review/${orderId}`);
  };

  // Don't render anything while checking
  if (isChecking) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="animate-pulse bg-gray-3 h-8 w-24 rounded-lg"></div>
      </div>
    );
  }

  // Don't render if can't review
  if (!canReview) {
    return null;
  }

  // Show review submitted state
  if (hasExistingReview) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1 text-green text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Review Submitted</span>
        </div>
      </div>
    );
  }

  // Show review button
  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={handleReviewClick}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue bg-white hover:bg-gray-1 border border-white/30 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue shadow-1 hover:shadow-2 transform hover:scale-105"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
        Leave Review
      </button>
    </div>
  );
};

export default ReviewButton;