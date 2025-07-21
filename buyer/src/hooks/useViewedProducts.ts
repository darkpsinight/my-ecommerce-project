import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '@/types/product';
import viewedProductsService, { 
  addViewedProduct as addViewedProductService,
  getViewedProducts as getViewedProductsService,
  clearViewedProducts as clearViewedProductsService,
  removeViewedProduct as removeViewedProductService,
  updateAuthStatus as updateAuthStatusService
} from '@/services/viewedProducts';

interface ViewMetadata {
  source?: 'homepage' | 'search' | 'category' | 'recommendation' | 'related' | 'seller_profile' | 'wishlist' | 'direct' | 'other';
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'other';
  sessionId?: string;
  referrer?: string;
  viewDuration?: number;
}

interface ViewedProductRecord {
  viewId: string;
  productId: string;
  viewedAt: string;
  metadata?: ViewMetadata;
  product?: Product;
}

interface UseViewedProductsOptions {
  limit?: number;
  offset?: number;
  includeProductDetails?: boolean;
  timeframe?: '7d' | '30d' | '90d' | 'all';
  autoFetch?: boolean;
}

interface UseViewedProductsReturn {
  viewedProducts: ViewedProductRecord[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  addViewedProduct: (productId: string, metadata?: ViewMetadata) => Promise<void>;
  removeViewedProduct: (productId: string) => Promise<boolean>;
  clearViewedProducts: (olderThan?: Date) => Promise<boolean>;
  refreshViewedProducts: () => Promise<void>;
  isProductViewed: (productId: string) => boolean;
  getViewCount: () => number;
}

export const useViewedProducts = (options: UseViewedProductsOptions = {}): UseViewedProductsReturn => {
  const {
    limit = 20,
    offset = 0,
    includeProductDetails = true,
    timeframe = '90d',
    autoFetch = true
  } = options;

  const [viewedProducts, setViewedProducts] = useState<ViewedProductRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchViewedProducts = useCallback(async () => {
    if (!isMounted.current) return;
    
    setLoading(true);
    setError(null);

    try {
      const products = await getViewedProductsService({
        limit,
        offset,
        includeProductDetails,
        timeframe
      });

      if (isMounted.current) {
        setViewedProducts(products);
        // Note: For localStorage, we don't have pagination info, so we estimate
        setHasMore(products.length === limit);
        setTotal(products.length);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch viewed products');
        console.error('Error fetching viewed products:', err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [limit, offset, includeProductDetails, timeframe]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchViewedProducts();
    }
  }, [fetchViewedProducts, autoFetch]);

  const addViewedProduct = useCallback(async (productId: string, metadata?: ViewMetadata) => {
    try {
      await addViewedProductService(productId, metadata);
      
      // Refresh the list to show the new addition
      if (autoFetch && isMounted.current) {
        await fetchViewedProducts();
      }
    } catch (err) {
      console.error('Error adding viewed product:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to add viewed product');
      }
    }
  }, [fetchViewedProducts, autoFetch]);

  const removeViewedProduct = useCallback(async (productId: string): Promise<boolean> => {
    try {
      const success = await removeViewedProductService(productId);
      
      if (success && isMounted.current) {
        // Update local state immediately for better UX
        setViewedProducts(prev => prev.filter(item => item.productId !== productId));
        setTotal(prev => Math.max(0, prev - 1));
      }
      
      return success;
    } catch (err) {
      console.error('Error removing viewed product:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to remove viewed product');
      }
      return false;
    }
  }, []);

  const clearViewedProducts = useCallback(async (olderThan?: Date): Promise<boolean> => {
    try {
      const success = await clearViewedProductsService(olderThan);
      
      if (success && isMounted.current) {
        if (olderThan) {
          // Filter out products older than the specified date
          setViewedProducts(prev => 
            prev.filter(item => new Date(item.viewedAt) >= olderThan)
          );
        } else {
          // Clear all products
          setViewedProducts([]);
          setTotal(0);
          setHasMore(false);
        }
      }
      
      return success;
    } catch (err) {
      console.error('Error clearing viewed products:', err);
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to clear viewed products');
      }
      return false;
    }
  }, []);

  const refreshViewedProducts = useCallback(async () => {
    await fetchViewedProducts();
  }, [fetchViewedProducts]);

  const isProductViewed = useCallback((productId: string): boolean => {
    return viewedProducts.some(item => item.productId === productId);
  }, [viewedProducts]);

  const getViewCount = useCallback((): number => {
    return viewedProducts.length;
  }, [viewedProducts]);

  return {
    viewedProducts,
    loading,
    error,
    hasMore,
    total,
    addViewedProduct,
    removeViewedProduct,
    clearViewedProducts,
    refreshViewedProducts,
    isProductViewed,
    getViewCount
  };
};

// Global tracking state to prevent duplicate calls across component remounts
const globalTrackingState = new Map<string, { timestamp: number; hasTracked: boolean }>();
const GLOBAL_DEBOUNCE_TIME = 5000; // 5 seconds global debounce

// Hook for tracking individual product views
interface UseProductViewTrackerOptions {
  productId: string;
  metadata?: ViewMetadata;
  trackOnMount?: boolean;
  trackOnFocus?: boolean;
  minViewDuration?: number; // Minimum time in ms before tracking view
}

export const useProductViewTracker = (options: UseProductViewTrackerOptions) => {
  const { productId, metadata, trackOnMount = true, trackOnFocus = false, minViewDuration = 3000 } = options;
  
  const [isTracking, setIsTracking] = useState(false);
  const viewStartTime = useRef<number | null>(null);
  const viewTimer = useRef<NodeJS.Timeout | null>(null);
  const hasTracked = useRef(false);

  const trackView = useCallback(async () => {
    console.log('🎯 trackView called:', { productId, hasTracked: hasTracked.current });
    
    if (!productId) {
      console.log('❌ No productId, returning');
      return;
    }
    
    if (hasTracked.current) {
      console.log('❌ Already tracked (local), returning');
      return;
    }

    // Check global tracking state to prevent duplicate calls across component remounts
    const now = Date.now();
    const globalState = globalTrackingState.get(productId);
    
    if (globalState && (now - globalState.timestamp) < GLOBAL_DEBOUNCE_TIME) {
      console.log('❌ Already tracked globally within debounce window, returning');
      hasTracked.current = true;
      return;
    }
    
    // Update global tracking state
    globalTrackingState.set(productId, { timestamp: now, hasTracked: true });
    console.log('✅ Updated global tracking state for product:', productId);

    console.log('✅ Starting view tracking...');
    setIsTracking(true);
    viewStartTime.current = Date.now();

    if (minViewDuration === 0) {
      // Track immediately without timer
      console.log('📤 Tracking immediately (no delay)');
      
      const duration = 0; // No duration since it's immediate
      
      console.log('📤 Calling addViewedProductService with:', { productId, metadata, duration });
      
      try {
        await addViewedProductService(productId, {
          ...metadata,
          viewDuration: duration
        });
        console.log('✅ addViewedProductService completed successfully');
      } catch (error) {
        console.error('❌ addViewedProductService failed:', error);
      }
      
      hasTracked.current = true;
      setIsTracking(false);
      console.log('✅ View tracking completed');
    } else {
      // Use timer for delayed tracking
      console.log(`⏰ Setting timer for ${minViewDuration}ms`);
      
      viewTimer.current = setTimeout(async () => {
        console.log('⏰ Timer triggered, tracking view now...');
        
        if (viewStartTime.current) {
          const duration = Date.now() - viewStartTime.current;
          
          console.log('📤 Calling addViewedProductService with:', { productId, metadata, duration });
          
          try {
            await addViewedProductService(productId, {
              ...metadata,
              viewDuration: duration
            });
            console.log('✅ addViewedProductService completed successfully');
          } catch (error) {
            console.error('❌ addViewedProductService failed:', error);
          }
          
          hasTracked.current = true;
          setIsTracking(false);
          console.log('✅ View tracking completed');
        }
      }, minViewDuration);
      
      console.log('✅ Timer set successfully');
    }
  }, [productId, metadata, minViewDuration]);

  const stopTracking = useCallback(() => {
    if (viewTimer.current) {
      clearTimeout(viewTimer.current);
      viewTimer.current = null;
    }
    setIsTracking(false);
    viewStartTime.current = null;
  }, []);

  // Track on mount
  useEffect(() => {
    console.log('🔄 useProductViewTracker effect:', { trackOnMount, productId });
    
    if (trackOnMount && productId) {
      console.log('🚀 Auto-tracking on mount');
      trackView();
    }

    return () => {
      console.log('🧹 useProductViewTracker cleanup');
      stopTracking();
    };
  }, [trackOnMount, productId, trackView, stopTracking]);

  // Track on window focus
  useEffect(() => {
    if (!trackOnFocus) return;

    const handleFocus = () => {
      if (productId && !hasTracked.current) {
        trackView();
      }
    };

    const handleBlur = () => {
      stopTracking();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [trackOnFocus, productId, trackView, stopTracking]);

  return {
    isTracking,
    trackView,
    stopTracking
  };
};

// Hook for authentication-aware view management
export const useAuthAwareViewedProducts = () => {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'completed' | 'error'>('idle');
  const [migrationResult, setMigrationResult] = useState<{ successful: number; failed: number } | null>(null);

  const handleAuthChange = useCallback(async (isAuthenticated: boolean) => {
    updateAuthStatusService(isAuthenticated);

    if (isAuthenticated && migrationStatus === 'idle') {
      setMigrationStatus('migrating');
      
      try {
        const result = await viewedProductsService.migrateLocalStorageToDatabase();
        setMigrationResult(result);
        setMigrationStatus('completed');
        
        // Auto-reset migration status after 5 seconds
        setTimeout(() => {
          setMigrationStatus('idle');
          setMigrationResult(null);
        }, 5000);
      } catch (error) {
        console.error('Migration failed:', error);
        setMigrationStatus('error');
        
        // Auto-reset error status after 10 seconds
        setTimeout(() => {
          setMigrationStatus('idle');
        }, 10000);
      }
    }
  }, [migrationStatus]);

  return {
    migrationStatus,
    migrationResult,
    handleAuthChange
  };
};