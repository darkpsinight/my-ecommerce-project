import { useEffect, useRef } from 'react';
import { Product } from '@/types/product';
import { addViewedProduct } from '@/services/viewedProducts';

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
  const startTimeRef = useRef<number | null>(null);
  const hasTrackedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate session ID
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Track product view with duration when product is loaded
  useEffect(() => {
    if (!enabled || !product?.id || hasTrackedRef.current) return;

    console.log('🎯 Starting duration tracking for:', product.id);
    
    // Mark as tracked to prevent duplicate tracking
    hasTrackedRef.current = true;
    startTimeRef.current = Date.now();
    sessionIdRef.current = generateSessionId();

    // Set up page visibility and beforeunload listeners for accurate duration tracking
    const handleVisibilityChange = () => {
      if (document.hidden && startTimeRef.current) {
        // User switched tabs or minimized - track duration
        trackFinalDuration('visibility_change');
      }
    };

    const handleBeforeUnload = () => {
      if (startTimeRef.current) {
        // User is leaving the page - track duration
        trackFinalDuration('page_unload');
      }
    };

    const trackFinalDuration = async (reason: string) => {
      if (!startTimeRef.current || !product?.id) return;

      const finalDuration = Date.now() - startTimeRef.current;
      
      // Only track if user spent more than 3 seconds for meaningful engagement
      if (finalDuration >= 3000) {
        console.log(`📊 Tracking final duration (${reason}):`, {
          productId: product.id,
          duration: finalDuration,
          durationSeconds: (finalDuration / 1000).toFixed(1)
        });

        try {
          await addViewedProduct(product.id, {
            source: "direct",
            referrer: typeof window !== "undefined" ? document.referrer : undefined,
            sessionId: sessionIdRef.current || undefined,
            viewDuration: finalDuration
          });
          console.log('✅ Duration tracked successfully');
          
          // Mark as tracked to prevent duplicate tracking
          startTimeRef.current = null;
        } catch (error) {
          console.error('❌ Error tracking duration:', error);
        }
      } else {
        console.log(`⏭️ Duration too short (${(finalDuration / 1000).toFixed(1)}s), not tracking`);
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Track final duration on component unmount
      if (startTimeRef.current) {
        const finalDuration = Date.now() - startTimeRef.current;
        
        if (finalDuration >= 3000) {
          console.log('📊 Tracking duration on cleanup:', finalDuration);
          
          addViewedProduct(product.id, {
            source: "direct",
            referrer: typeof window !== "undefined" ? document.referrer : undefined,
            sessionId: sessionIdRef.current || undefined,
            viewDuration: finalDuration
          }).catch(error => {
            console.error('❌ Error tracking cleanup duration:', error);
          });
        }
      }
    };
  }, [product?.id, enabled]);

  // Reset tracking state when product changes
  useEffect(() => {
    hasTrackedRef.current = false;
    startTimeRef.current = null;
    sessionIdRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [productId]);

  return {
    isTracking: hasTrackedRef.current,
    sessionId: sessionIdRef.current,
    getSessionInfo: () => {
      if (!startTimeRef.current) return null;
      return {
        duration: Date.now() - startTimeRef.current,
        isActive: true
      };
    }
  };
};