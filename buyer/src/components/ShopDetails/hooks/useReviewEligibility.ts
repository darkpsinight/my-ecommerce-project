import { useState, useEffect, useCallback } from 'react';
import { useAppSelector } from '@/redux/store';
import { selectIsAuthenticated } from '@/redux/features/auth-slice';
import { reviewService } from '@/services/reviews';

interface ReviewEligibilityState {
  canReview: boolean;
  isLoading: boolean;
  error: string | null;
  hasExistingReview: boolean;
  purchaseOrderId?: string;
  reason?: string;
}

interface UseReviewEligibilityOptions {
  productId: string | null;
  enabled?: boolean;
}

export const useReviewEligibility = ({ 
  productId, 
  enabled = true 
}: UseReviewEligibilityOptions) => {
  const [state, setState] = useState<ReviewEligibilityState>({
    canReview: false,
    isLoading: false,
    error: null,
    hasExistingReview: false
  });

  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const checkEligibility = useCallback(async () => {
    if (!enabled || !productId || !isAuthenticated) {
      setState({
        canReview: false,
        isLoading: false,
        error: null,
        hasExistingReview: false,
        reason: !isAuthenticated ? 'Please login to leave a review' : 'Product not found'
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if user has purchased this product
      const response = await fetch(`/api/v1/reviews/can-review-product/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to check review eligibility');
      }

      const data = await response.json();
      
      setState({
        canReview: data.canReview || false,
        isLoading: false,
        error: null,
        hasExistingReview: data.hasExistingReview || false,
        purchaseOrderId: data.purchaseOrderId,
        reason: data.reason
      });
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      setState({
        canReview: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check eligibility',
        hasExistingReview: false,
        reason: 'Unable to verify purchase history'
      });
    }
  }, [enabled, productId, isAuthenticated]);

  // Helper function to get auth token
  const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
      try {
        const { store } = require('@/redux/store');
        return store.getState().authReducer.token;
      } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
      }
    }
    return null;
  };

  // Check eligibility when dependencies change
  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  // Re-check when authentication status changes
  useEffect(() => {
    if (isAuthenticated && productId) {
      checkEligibility();
    }
  }, [isAuthenticated, productId, checkEligibility]);

  return {
    ...state,
    refetch: checkEligibility
  };
};