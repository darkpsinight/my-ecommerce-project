"use client";
import React from 'react';
import { ListingReviewsResponse } from '@/services/reviews';
import ReviewsSummary from './ReviewsSummary';
import ReviewSubmission from './ReviewSubmission';

interface ProductReviewsProps {
  reviewsData: ListingReviewsResponse | null;
  reviewsLoading: boolean;
  currentReviewPage: number;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  handlePageClick: (page: number) => void;
  // Review submission props
  canLeaveReview: boolean;
  reviewEligibilityLoading: boolean;
  hasExistingReview: boolean;
  onLeaveReview: () => void;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  reviewsData,
  reviewsLoading,
  currentReviewPage,
  handleNextPage,
  handlePrevPage,
  handlePageClick,
  canLeaveReview,
  reviewEligibilityLoading,
  hasExistingReview,
  onLeaveReview
}) => {
  if (!reviewsData) return null;

  return (
    <div id="customer-reviews" className="mt-12">
      {/* Amazon-style Reviews Summary */}
      <ReviewsSummary reviewsData={reviewsData} />

      {/* Review Submission (only shows if user purchased) */}
      <ReviewSubmission
        canLeaveReview={canLeaveReview}
        reviewEligibilityLoading={reviewEligibilityLoading}
        hasExistingReview={hasExistingReview}
        onLeaveReview={onLeaveReview}
      />

      {/* Reviews List */}
      <div className="space-y-6">
        {reviewsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
          </div>
        ) : reviewsData.reviews.length > 0 ? (
          reviewsData.reviews.map((review, index) => (
            <div
              key={`review-${index}-${review.createdAt}`}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue font-semibold text-sm">
                      {review.reviewerId?.name?.charAt(0).toUpperCase() || "A"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {review.reviewerId?.name || "Anonymous"}
                    </h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, starIndex) => (
                        <svg
                          key={starIndex}
                          className={`w-4 h-4 ${
                            starIndex < review.rating
                              ? "fill-yellow"
                              : "fill-gray-300"
                          }`}
                          viewBox="0 0 18 18"
                        >
                          <path d="M16.7906 6.72187L11.7 5.93438L9.39377 1.09688C9.22502 0.759375 8.77502 0.759375 8.60627 1.09688L6.30002 5.93438L1.20939 6.72187C0.834393 6.78125 0.675018 7.23125 0.937518 7.48438L4.65002 11.1094L3.73127 16.1719C3.66252 16.5469 4.04377 16.8281 4.37502 16.6594L9.00002 14.2031L13.625 16.6594C13.9563 16.8281 14.3375 16.5469 14.2688 16.1719L13.35 11.1094L17.0625 7.48438C17.325 7.23125 17.1656 6.78125 16.7906 6.72187Z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {review.comment}
              </p>
              
              {/* Admin Response */}
              {review.adminResponse && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-blue text-sm">Admin Response</span>
                    {review.adminResponseDate && (
                      <span className="text-xs text-gray-500">
                        {new Date(review.adminResponseDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm">{review.adminResponse}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No reviews yet. Be the first to review!
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {reviewsData.pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={handlePrevPage}
            disabled={currentReviewPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {[...Array(reviewsData.pagination.pages)].map((_, index) => {
            const page = index + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentReviewPage === page
                    ? "text-white bg-blue border border-blue"
                    : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={handleNextPage}
            disabled={currentReviewPage === reviewsData.pagination.pages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductReviews;