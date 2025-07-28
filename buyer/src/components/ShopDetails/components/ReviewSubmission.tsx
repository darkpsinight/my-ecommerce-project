"use client";
import React from 'react';

interface ReviewSubmissionProps {
  canLeaveReview: boolean;
  reviewEligibilityLoading: boolean;
  hasExistingReview: boolean;
  onLeaveReview: () => void;
}

const ReviewSubmission: React.FC<ReviewSubmissionProps> = ({
  canLeaveReview,
  reviewEligibilityLoading,
  hasExistingReview,
  onLeaveReview
}) => {
  // Don't show anything if loading or not eligible
  if (reviewEligibilityLoading || !canLeaveReview) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Review this product
      </h3>
      <p className="text-gray-600 mb-4">
        Share your thoughts with other customers
      </p>
      
      <button
        onClick={onLeaveReview}
        className="w-full max-w-md bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        {hasExistingReview ? 'Update your review' : 'Write a customer review'}
      </button>
    </div>
  );
};

export default ReviewSubmission;