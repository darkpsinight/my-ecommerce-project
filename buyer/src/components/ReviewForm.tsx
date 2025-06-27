"use client";
import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { reviewService, CanReviewOrderResponse } from '../services/reviews';

interface ReviewFormProps {
  orderId: string;
  onReviewSubmitted?: () => void;
  className?: string;
  isStandalonePage?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  orderId,
  onReviewSubmitted,
  className = '',
  isStandalonePage = false
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      await reviewService.createReview({
        orderId,
        rating,
        comment: comment.trim() || undefined
      });

      setSuccess('Thank you for your review! Your feedback helps other buyers.');
      setRating(0);
      setComment('');
      
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      setError(error.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display success message if review was just submitted
  if (success) {
    return (
      <div className={`bg-white rounded-lg shadow-1 p-4 sm:p-6 ${className}`}>
        <div className="text-center">
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
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Review Submitted Successfully!
          </h3>
          <p className="text-gray-600 mb-6">
            {success}
          </p>
        </div>
      </div>
    );
  }

  // Main review form
  return (
    <div className={`bg-white rounded-lg shadow-1 p-4 sm:p-6 ${className}`}>
      {!isStandalonePage && (
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
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
          <div>
            <h3 className="text-lg font-semibold text-gray-7 mb-2">
              Leave a Review
            </h3>
            <p className="text-gray-6">
              Share your experience with this purchase to help other buyers make informed decisions.
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-light-6 border border-red-light-3 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-dark">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-7 mb-3">
            Rating <span className="text-red">*</span>
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <StarRating
                rating={rating}
                onRatingChange={setRating}
                size="lg"
                className="flex-shrink-0"
              />
              {rating > 0 && (
                <span className="text-sm text-gray-6">
                  {rating} out of 5 stars - {
                    rating === 5 ? 'Excellent' :
                    rating === 4 ? 'Very Good' :
                    rating === 3 ? 'Good' :
                    rating === 2 ? 'Fair' :
                    'Poor'
                  }
                </span>
              )}
            </div>
            
            {rating === 0 ? (
              <div className="text-xs text-gray-5">
                <p className="mb-1">Click on stars to rate your experience:</p>
                <div className="grid grid-cols-1 gap-1">
                  <span>⭐ Poor - Major issues with product or service</span>
                  <span>⭐⭐ Fair - Below expectations, some problems</span>
                  <span>⭐⭐⭐ Good - Meets expectations, satisfactory</span>
                  <span>⭐⭐⭐⭐ Very Good - Exceeds expectations</span>
                  <span>⭐⭐⭐⭐⭐ Excellent - Outstanding quality and service</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-7 mb-2">
            Comment <span className="text-gray-5">(Optional)</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this purchase..."
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-3 border border-gray-3 rounded-lg focus:ring-2 focus:ring-blue focus:border-blue outline-none transition-colors resize-none"
          />
          <div className="flex justify-between items-start mt-2">
            <div className="flex-1">
              <p className="text-xs text-gray-5 mb-1">
                Help other buyers by sharing details about:
              </p>
              <ul className="text-xs text-gray-5 list-disc list-inside space-y-0.5">
                <li>Product quality and authenticity</li>
                <li>Delivery speed and reliability</li>
                <li>Overall purchasing experience</li>
              </ul>
            </div>
            <span className="text-xs text-gray-5 ml-4 flex-shrink-0">
              {comment.length}/1000
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="flex-1 py-3 px-6 bg-blue text-white font-medium rounded-lg hover:bg-blue-dark focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </div>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;