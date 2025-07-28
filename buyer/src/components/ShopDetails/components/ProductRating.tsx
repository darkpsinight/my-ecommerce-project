"use client";
import React from 'react';
import { ListingReviewsResponse } from '@/services/reviews';

interface ProductRatingProps {
  reviewsData: ListingReviewsResponse | null;
  showReviewsInfo: boolean;
  setShowReviewsInfo: (show: boolean) => void;
}

const ProductRating: React.FC<ProductRatingProps> = ({
  reviewsData,
  showReviewsInfo,
  setShowReviewsInfo
}) => {
  const averageRating = reviewsData?.statistics.averageRating || 4.5;
  const totalReviews = reviewsData?.statistics.totalReviews || 0;

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, index) => (
            <svg
              key={index}
              className={`w-4 h-4 ${
                index < Math.round(averageRating) ? "fill-yellow" : "fill-gray-300"
              }`}
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16.7906 6.72187L11.7 5.93438L9.39377 1.09688C9.22502 0.759375 8.77502 0.759375 8.60627 1.09688L6.30002 5.93438L1.20939 6.72187C0.834393 6.78125 0.675018 7.23125 0.937518 7.48438L4.65002 11.1094L3.73127 16.1719C3.66252 16.5469 4.04377 16.8281 4.37502 16.6594L9.00002 14.2031L13.625 16.6594C13.9563 16.8281 14.3375 16.5469 14.2688 16.1719L13.35 11.1094L17.0625 7.48438C17.325 7.23125 17.1656 6.78125 16.7906 6.72187Z"
                fill=""
              />
            </svg>
          ))}
        </div>
        <span className="text-sm font-medium text-amber-700">
          {averageRating.toFixed(1)} ({totalReviews} reviews)
        </span>
      </div>

      <button
        onClick={() => setShowReviewsInfo(!showReviewsInfo)}
        className="text-sm text-blue hover:text-blue-dark transition-colors duration-200 underline"
      >
        View all reviews
      </button>
    </div>
  );
};

export default ProductRating;