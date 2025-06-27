"use client";
import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { reviewService, CanReviewOrderResponse } from '../services/reviews';

interface ReviewFormProps {
  orderId: string;
  onReviewSubmitted?: () => void;
  className?: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  orderId,
  onReviewSubmitted,
  className = ''
}) => {
  const [canReview, setCanReview] = useState<CanReviewOrderResponse | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    checkReviewEligibility();
  }, [orderId]);

  // Show form always for debugging - TEMPORARY
  const shouldShowDebugForm = true;

  const checkReviewEligibility = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await reviewService.canUserReviewOrder(orderId);
      setCanReview(response);
    } catch (error: any) {
      console.error('Error checking review eligibility:', error);
      setError('Unable to check review eligibility. Please try again later.');
      // For debugging, set a mock canReview response
      setCanReview({
        canReview: true,
        reason: 'Debug mode - order completed',
        order: {
          externalId: orderId,
          totalAmount: 99.99,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          orderItems: [{
            title: 'Debug Product',
            platform: 'Steam',
            region: 'Global',
            quantity: 1,
            totalPrice: 99.99
          }]
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

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
      
      // Refresh review eligibility to show existing review
      await checkReviewEligibility();
      
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

  // Debug: Always show the form for testing
  if (shouldShowDebugForm) {
    return (
      <div className={`bg-white rounded-lg shadow-1 p-4 sm:p-6 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
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
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-7 mb-2">
              Leave a Review
            </h3>
            <p className="text-gray-6 mb-6">
              Share your experience with this purchase to help other buyers make informed decisions.
            </p>

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
                  
                  {rating === 0 && error && (
                    <p className="text-red text-sm">Please select a rating</p>
                  )}
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
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-1 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-2 rounded w-32 mb-4"></div>
          <div className="h-4 bg-gray-2 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-2 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Debug: Log the current state
  console.log('ReviewForm Debug:', {
    orderId,
    canReview,
    isLoading,
    error
  });

  if (!canReview) {
    // Show error state if API call failed
    if (error) {
      return (
        <div className={`bg-white rounded-lg shadow-1 p-4 sm:p-6 ${className}`}>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-light-6 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red"
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
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-7 mb-2">
                Unable to Load Review Section
              </h3>
              <p className="text-gray-6 mb-4">
                {error}
              </p>
              <button 
                onClick={checkReviewEligibility}
                className="text-blue hover:text-blue-dark text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  if (!canReview.canReview) {
    if (canReview.existingReview) {
      return (
        <div className={`bg-white rounded-lg shadow-1 p-4 sm:p-6 ${className}`}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-light-6 rounded-full flex items-center justify-center">
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
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-7 mb-2">
                Review Already Submitted
              </h3>
              <p className="text-gray-6 mb-4">
                Thank you for sharing your feedback! Here&apos;s your review:
              </p>
              <div className="bg-gray-1 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <StarRating rating={canReview.existingReview.rating} readonly size="sm" />
                  <span className="text-sm text-gray-6">
                    {new Date(canReview.existingReview.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {canReview.existingReview.comment && (
                  <p className="text-gray-7 text-sm leading-relaxed">
                    {canReview.existingReview.comment}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-1 p-4 sm:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
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
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-7 mb-2">
            Leave a Review
          </h3>
          <p className="text-gray-6 mb-6">
            Share your experience with this purchase to help other buyers make informed decisions.
          </p>

          {success && (
            <div className="mb-6 p-4 bg-green-light-6 border border-green-light-4 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green flex-shrink-0"
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
                <p className="text-green-dark text-sm">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-light-6 border border-red-light-4 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-red flex-shrink-0"
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
                <p className="text-red-dark text-sm">{error}</p>
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
                
                {rating === 0 && error && (
                  <p className="text-red text-sm">Please select a rating</p>
                )}
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

            {/* Order Info */}
            {canReview.order && (
              <div className="bg-gray-1 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-7 mb-2">Order Details</h4>
                <div className="space-y-1">
                  {canReview.order.orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-6">
                        {item.title} - {item.platform} ({item.region})
                      </span>
                      <span className="text-gray-7 font-medium">
                        {item.quantity}x ${item.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-3 pt-2 mt-2">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <span className="text-gray-7">Total</span>
                      <span className="text-gray-7">
                        ${canReview.order.totalAmount.toFixed(2)} {canReview.order.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
      </div>
    </div>
  );
};

export default ReviewForm;