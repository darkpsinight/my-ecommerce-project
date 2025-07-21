/**
 * React hook for product view tracking
 * Automatically tracks views when component mounts and handles cleanup
 */

import { useEffect, useRef } from 'react';
import { trackProductView, trackProductViewWithTiming } from '../utils/viewTracking';

export const useViewTracking = (productId, options = {}) => {
  const {
    source = 'direct',
    trackTiming = false,
    delay = 1000, // Delay before tracking (to avoid accidental views)
    enabled = true
  } = options;

  const timeoutRef = useRef(null);
  const stopTrackingRef = useRef(null);

  useEffect(() => {
    if (!enabled || !productId) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Track view after delay
    timeoutRef.current = setTimeout(() => {
      if (trackTiming) {
        stopTrackingRef.current = trackProductViewWithTiming(productId, { source });
      } else {
        trackProductView(productId, { source });
      }
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (stopTrackingRef.current) {
        stopTrackingRef.current();
      }
    };
  }, [productId, source, trackTiming, delay, enabled]);

  // Return manual tracking function for special cases
  const manualTrack = (customOptions = {}) => {
    trackProductView(productId, { source, ...customOptions });
  };

  return { manualTrack };
};

// Hook for tracking multiple products (useful for product lists)
export const useMultipleViewTracking = (productIds, options = {}) => {
  const {
    source = 'category',
    threshold = 0.5, // Percentage of element that needs to be visible
    delay = 2000,
    enabled = true
  } = options;

  const observerRef = useRef(null);
  const trackedProductsRef = useRef(new Set());

  useEffect(() => {
    if (!enabled || !productIds?.length) return;

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            const productId = entry.target.dataset.productId;
            if (productId && !trackedProductsRef.current.has(productId)) {
              trackedProductsRef.current.add(productId);
              setTimeout(() => {
                trackProductView(productId, { source });
              }, delay);
            }
          }
        });
      },
      { threshold }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [productIds, source, threshold, delay, enabled]);

  // Function to observe a product element
  const observeProduct = (element, productId) => {
    if (observerRef.current && element) {
      element.dataset.productId = productId;
      observerRef.current.observe(element);
    }
  };

  // Function to stop observing a product element
  const unobserveProduct = (element) => {
    if (observerRef.current && element) {
      observerRef.current.unobserve(element);
    }
  };

  return { observeProduct, unobserveProduct };
};

// Usage examples:
/*
// Basic usage in a product detail component
function ProductDetail({ productId }) {
  useViewTracking(productId, { 
    source: 'product_detail',
    trackTiming: true,
    delay: 2000 
  });
  
  return <div>Product details...</div>;
}

// Usage in a product list component
function ProductList({ products }) {
  const { observeProduct, unobserveProduct } = useMultipleViewTracking(
    products.map(p => p.id),
    { source: 'product_list', threshold: 0.7 }
  );
  
  return (
    <div>
      {products.map(product => (
        <div 
          key={product.id}
          ref={(el) => el && observeProduct(el, product.id)}
        >
          {product.name}
        </div>
      ))}
    </div>
  );
}

// Manual tracking
function SearchResults({ products }) {
  const { manualTrack } = useViewTracking(null, { enabled: false });
  
  const handleProductClick = (productId) => {
    manualTrack({ source: 'search_results' });
    // Navigate to product...
  };
  
  return <div>...</div>;
}
*/