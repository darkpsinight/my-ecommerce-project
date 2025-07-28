import { useEffect } from 'react';
import { Product } from '@/types/product';
import { useProductViewTracker } from '@/hooks/useViewedProducts';
import { useTimeTracking } from '@/utils/timeTracking';

interface UseProductTrackingOptions {
  product: Product | null;
  productId: string | null;
  enabled?: boolean;
}

export const useProductTracking = ({ 
  product, 
  productId, 
  enabled = true 
}: UseProductTrackingOptions) => {
  // View tracking with hybrid storage system
  const { isTracking, trackView } = useProductViewTracker({
    productId: productId || "",
    metadata: {
      source: "direct",
      referrer: typeof window !== "undefined" ? document.referrer : undefined,
    },
    trackOnMount: false, // We'll track manually after product is loaded
    minViewDuration: 3000, // Track after 3 seconds to capture meaningful engagement
  });

  // Duration tracking
  const { startTracking, stopTracking, getSessionInfo } = useTimeTracking(productId);

  // Track product view when product is loaded
  useEffect(() => {
    if (!enabled || !product?.id) return;

    console.log('🎯 About to call trackView() for product:', product.id);
    try {
      trackView();
      console.log('✅ trackView() called successfully');
    } catch (error) {
      console.error('❌ Error calling trackView():', error);
    }
  }, [product?.id, trackView, enabled]);

  // Start duration tracking when product is loaded
  useEffect(() => {
    if (!enabled || !productId) return;

    console.log('⏱️ Starting duration tracking for product:', productId);
    const sessionId = startTracking();
    console.log('⏱️ Duration tracking started with session:', sessionId);

    return () => {
      console.log('⏱️ Stopping duration tracking for product:', productId);
      stopTracking();
    };
  }, [productId, startTracking, stopTracking, enabled]);

  return {
    isTracking,
    trackView,
    getSessionInfo,
    startTracking,
    stopTracking
  };
};