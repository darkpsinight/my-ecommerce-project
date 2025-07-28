import { Product } from '@/types/product';
import { ListingReviewsResponse } from '@/services/reviews';

// Common interfaces for ShopDetails components
export interface Tab {
  id: string;
  title: string;
}

export interface TrackingMetadata {
  source?: 'homepage' | 'search' | 'category' | 'recommendation' | 'related' | 'seller_profile' | 'wishlist' | 'direct' | 'other';
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'other';
  sessionId?: string;
  referrer?: string;
  viewDuration?: number;
}

export interface AnalyticsEvent {
  event: string;
  productId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
}

export interface ExpirationGroupSelection {
  type: "never_expires" | "expires";
  count: number;
  date?: string;
}

// Hook return types
export interface UseProductDataReturn {
  product: Product | null;
  productId: string | null;
  loading: boolean;
  router: any;
}

export interface UseProductTrackingReturn {
  isTracking: boolean;
  trackView: () => Promise<void>;
  getSessionInfo: () => { duration: number; isActive: boolean } | null;
  startTracking: () => string | null;
  stopTracking: () => void;
}

export interface UseProductReviewsReturn {
  reviewsData: ListingReviewsResponse | null;
  reviewsLoading: boolean;
  currentReviewPage: number;
  handleNextPage: () => void;
  handlePrevPage: () => void;
  handlePageClick: (page: number) => void;
  fetchReviews: (listingId: string, page?: number) => Promise<void>;
}

export interface UseProductActionsReturn {
  isReviewModalOpen: boolean;
  setIsReviewModalOpen: (open: boolean) => void;
  isItemBeingAdded: boolean;
  isInWishlist: boolean;
  isWishlistLoading: boolean;
  isOutOfStock: boolean;
  wouldExceedStock: boolean;
  handleAddToCart: () => void;
  handleAddToWishlist: () => Promise<void>;
  handleLeaveReview: () => void;
  canLeaveReview: boolean;
  reviewEligibilityLoading: boolean;
  hasExistingReview: boolean;
  reviewEligibilityReason?: string;
}

export interface ReviewEligibilityState {
  canReview: boolean;
  isLoading: boolean;
  error: string | null;
  hasExistingReview: boolean;
  purchaseOrderId?: string;
  reason?: string;
}

export interface UseReviewEligibilityReturn extends ReviewEligibilityState {
  refetch: () => Promise<void>;
}

export interface UseExpirationGroupsReturn {
  expirationGroups: any[];
  selectedExpirationGroups: ExpirationGroupSelection[];
  setSelectedExpirationGroups: (groups: ExpirationGroupSelection[]) => void;
  expirationGroupsLoading: boolean;
  useExpirationGroups: boolean;
}

export interface UseProductAnalyticsReturn {
  trackEvent: (eventName: string, metadata?: Record<string, any>) => void;
  trackInteraction: (interactionType: string, details?: Record<string, any>) => void;
  flushAnalytics: () => Promise<void>;
  getQueuedEvents: () => AnalyticsEvent[];
  getInteractionCount: () => number;
  getScrollDepthMarkers: () => number[];
}

export interface UseProductPerformanceReturn {
  getMetrics: () => PerformanceMetrics;
  measureRenderTime: () => void;
  measureFirstInteraction: () => void;
  measureMemoryUsage: () => void;
  sendMetrics: () => Promise<void>;
}