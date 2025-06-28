"use client";
import { useState, useEffect, useCallback } from "react";
import { reviewService } from "@/services/reviews";

interface ReviewStatus {
  canReview: boolean;
  hasExistingReview: boolean;
  isChecking: boolean;
}

interface UseOrderReviewsReturn {
  reviewStatuses: Record<string, ReviewStatus>;
  checkReviewEligibility: (orderId: string) => Promise<void>;
}

// Global cache to prevent duplicate API calls across component instances
const reviewEligibilityCache = new Map<string, {
  canReview: boolean;
  hasExistingReview: boolean;
  timestamp: number;
}>();

// Cache expiry time (5 minutes)
const CACHE_EXPIRY_TIME = 5 * 60 * 1000;

// Track ongoing requests to prevent duplicate calls
const ongoingRequests = new Set<string>();

export const useOrderReviews = (): UseOrderReviewsReturn => {
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, ReviewStatus>>({});

  const checkReviewEligibility = useCallback(async (orderId: string) => {
    // Check if request is already ongoing
    if (ongoingRequests.has(orderId)) {
      return;
    }

    // Check cache first
    const cached = reviewEligibilityCache.get(orderId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_EXPIRY_TIME) {
      // Use cached data
      setReviewStatuses(prev => ({
        ...prev,
        [orderId]: {
          canReview: cached.canReview,
          hasExistingReview: cached.hasExistingReview,
          isChecking: false
        }
      }));
      return;
    }

    // Mark request as ongoing
    ongoingRequests.add(orderId);

    // Set loading state
    setReviewStatuses(prev => ({
      ...prev,
      [orderId]: {
        canReview: false,
        hasExistingReview: false,
        isChecking: true
      }
    }));

    try {
      const response = await reviewService.canUserReviewOrder(orderId);
      
      // Cache the result
      reviewEligibilityCache.set(orderId, {
        canReview: response.canReview,
        hasExistingReview: !!response.existingReview,
        timestamp: now
      });
      
      // Update state
      setReviewStatuses(prev => ({
        ...prev,
        [orderId]: {
          canReview: response.canReview,
          hasExistingReview: !!response.existingReview,
          isChecking: false
        }
      }));
    } catch (error) {
      console.error(`Error checking review eligibility for order ${orderId}:`, error);
      setReviewStatuses(prev => ({
        ...prev,
        [orderId]: {
          canReview: false,
          hasExistingReview: false,
          isChecking: false
        }
      }));
    } finally {
      // Remove from ongoing requests
      ongoingRequests.delete(orderId);
    }
  }, []);

  return {
    reviewStatuses,
    checkReviewEligibility,
  };
};