/**
 * React hook for impression tracking
 * Automatically tracks impressions when components mount and handles cleanup
 */

import { useEffect, useRef, useCallback } from 'react';
import { 
  trackImpression, 
  trackMultipleImpressions, 
  markImpressionClicked,
  ImpressionObserver 
} from '../utils/impressionTracking';

// Hook for tracking single product impression
export const useImpressionTracking = (productId, options = {}) => {
  const {
    source = 'other',
    position,
    totalItemsShown,
    searchQuery,
    category,
    platform,
    trackOnMount = true,
    trackOnVisible = false,
    visibilityThreshold = 0.5,
    trackingDelay = 1000,
    enabled = true
  } = options;

  const elementRef = useRef(null);
  const observerRef = useRef(null);
  const hasTrackedRef = useRef(false);
  const timeoutRef = useRef(null);

  // Manual tracking function
  const manualTrack = useCallback(async (customOptions = {}) => {
    if (!enabled || !productId) return null;
    
    const trackingOptions = {
      source,
      position,
      totalItemsShown,
      searchQuery,
      category,
      platform,
      element: elementRef.current,
      ...customOptions
    };

    return await trackImpression(productId, trackingOptions);
  }, [productId, source, position, totalItemsShown, searchQuery, category, platform, enabled]);

  // Track impression on mount
  useEffect(() => {
    if (!enabled || !productId || !trackOnMount || hasTrackedRef.current) return;

    timeoutRef.current = setTimeout(async () => {
      await manualTrack();
      hasTrackedRef.current = true;
    }, trackingDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [productId, trackOnMount, trackingDelay, enabled, manualTrack]);

  // Track impression on visibility
  useEffect(() => {
    if (!enabled || !productId || !trackOnVisible || !elementRef.current) return;

    if (!window.IntersectionObserver) {
      console.warn('IntersectionObserver not supported');
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !hasTrackedRef.current) {
            setTimeout(async () => {
              if (entry.isIntersecting && !hasTrackedRef.current) {
                await manualTrack();
                hasTrackedRef.current = true;
              }
            }, trackingDelay);
          }
        });
      },
      { threshold: visibilityThreshold }
    );

    observerRef.current.observe(elementRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [productId, trackOnVisible, visibilityThreshold, trackingDelay, enabled, manualTrack]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    elementRef,
    manualTrack,
    hasTracked: hasTrackedRef.current
  };
};

// Hook for tracking multiple products (useful for product lists)
export const useMultipleImpressionTracking = (products, options = {}) => {
  const {
    source = 'other',
    trackOnMount = false,
    trackOnVisible = true,
    visibilityThreshold = 0.5,
    trackingDelay = 1000,
    enabled = true
  } = options;

  const observerRef = useRef(null);
  const trackedProductsRef = useRef(new Set());
  const elementRefsRef = useRef(new Map());

  // Manual tracking function for all products
  const trackAllImpressions = useCallback(async (customOptions = {}) => {
    if (!enabled || !products || products.length === 0) return [];

    const impressions = products.map((product, index) => ({
      productId: product.id || product.productId,
      position: product.position !== undefined ? product.position : index + 1,
      element: elementRefsRef.current.get(product.id || product.productId)
    }));

    const trackingOptions = {
      source,
      ...customOptions
    };

    return await trackMultipleImpressions(impressions, trackingOptions);
  }, [products, source, enabled]);

  // Track all impressions on mount
  useEffect(() => {
    if (!enabled || !products || products.length === 0 || !trackOnMount) return;

    const timeout = setTimeout(async () => {
      await trackAllImpressions();
      products.forEach(product => {
        trackedProductsRef.current.add(product.id || product.productId);
      });
    }, trackingDelay);

    return () => clearTimeout(timeout);
  }, [products, trackOnMount, trackingDelay, enabled, trackAllImpressions]);

  // Set up intersection observer for visibility tracking
  useEffect(() => {
    if (!enabled || !trackOnVisible || !window.IntersectionObserver) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleProducts = [];
        
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const productId = entry.target.dataset.productId;
            if (productId && !trackedProductsRef.current.has(productId)) {
              const product = products.find(p => (p.id || p.productId) === productId);
              if (product) {
                visibleProducts.push(product);
              }
            }
          }
        });

        if (visibleProducts.length > 0) {
          setTimeout(async () => {
            const impressions = visibleProducts
              .filter(product => !trackedProductsRef.current.has(product.id || product.productId))
              .map((product, index) => ({
                productId: product.id || product.productId,
                position: product.position !== undefined ? product.position : index + 1,
                element: elementRefsRef.current.get(product.id || product.productId)
              }));

            if (impressions.length > 0) {
              await trackMultipleImpressions(impressions, { source });
              impressions.forEach(impression => {
                trackedProductsRef.current.add(impression.productId);
              });
            }
          }, trackingDelay);
        }
      },
      { threshold: visibilityThreshold }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [products, source, trackOnVisible, visibilityThreshold, trackingDelay, enabled]);

  // Function to observe a product element
  const observeProduct = useCallback((productId, element) => {
    if (!enabled || !element || !observerRef.current) return;

    element.dataset.productId = productId;
    elementRefsRef.current.set(productId, element);
    observerRef.current.observe(element);
  }, [enabled]);

  // Function to unobserve a product element
  const unobserveProduct = useCallback((productId, element) => {
    if (!element || !observerRef.current) return;

    observerRef.current.unobserve(element);
    elementRefsRef.current.delete(productId);
    trackedProductsRef.current.delete(productId);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      trackedProductsRef.current.clear();
      elementRefsRef.current.clear();
    };
  }, []);

  return {
    trackAllImpressions,
    observeProduct,
    unobserveProduct,
    trackedProducts: Array.from(trackedProductsRef.current)
  };
};

// Hook for marking impressions as clicked
export const useImpressionClickTracking = () => {
  const markClicked = useCallback(async (productId, viewId = null) => {
    return await markImpressionClicked(productId, viewId);
  }, []);

  return { markClicked };
};

// Combined hook for complete impression and click tracking
export const useCompleteImpressionTracking = (productId, options = {}) => {
  const impressionTracking = useImpressionTracking(productId, options);
  const { markClicked } = useImpressionClickTracking();

  const handleProductClick = useCallback(async (viewId = null) => {
    return await markClicked(productId, viewId);
  }, [productId, markClicked]);

  return {
    ...impressionTracking,
    markClicked: handleProductClick
  };
};

/*
Usage Examples:

// Basic impression tracking in a product component
function ProductCard({ product }) {
  const { elementRef } = useImpressionTracking(product.id, {
    source: 'search_results',
    position: product.position,
    trackOnVisible: true
  });

  return (
    <div ref={elementRef} data-product-id={product.id}>
      <h3>{product.title}</h3>
      <p>{product.price}</p>
    </div>
  );
}

// Multiple products tracking in a list
function ProductList({ products }) {
  const { observeProduct, unobserveProduct } = useMultipleImpressionTracking(
    products,
    { source: 'category_page', trackOnVisible: true }
  );

  useEffect(() => {
    // Observe all product elements
    products.forEach(product => {
      const element = document.querySelector(`[data-product-id="${product.id}"]`);
      if (element) {
        observeProduct(product.id, element);
      }
    });

    return () => {
      // Cleanup
      products.forEach(product => {
        const element = document.querySelector(`[data-product-id="${product.id}"]`);
        if (element) {
          unobserveProduct(product.id, element);
        }
      });
    };
  }, [products, observeProduct, unobserveProduct]);

  return (
    <div>
      {products.map(product => (
        <div key={product.id} data-product-id={product.id}>
          <h3>{product.title}</h3>
        </div>
      ))}
    </div>
  );
}

// Complete tracking with click handling
function ProductDetail({ productId }) {
  const { elementRef, markClicked } = useCompleteImpressionTracking(productId, {
    source: 'product_detail',
    trackOnMount: true
  });

  const handleAddToCart = async () => {
    await markClicked(); // Mark as clicked when user interacts
    // Add to cart logic...
  };

  return (
    <div ref={elementRef}>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
*/