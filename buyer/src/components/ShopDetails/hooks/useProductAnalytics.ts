import { useEffect, useRef, useCallback } from 'react';
import { Product } from '@/types/product';

interface AnalyticsEvent {
  event: string;
  productId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface UseProductAnalyticsOptions {
  product: Product | null;
  enabled?: boolean;
}

export const useProductAnalytics = ({ 
  product, 
  enabled = true 
}: UseProductAnalyticsOptions) => {
  const analyticsQueue = useRef<AnalyticsEvent[]>([]);
  const lastScrollPosition = useRef(0);
  const scrollDepthMarkers = useRef(new Set<number>());
  const interactionCount = useRef(0);

  // Track scroll depth
  const trackScrollDepth = useCallback(() => {
    if (!enabled || !product) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = Math.round((scrollTop / documentHeight) * 100);

    // Track at 25%, 50%, 75%, and 100% scroll depths
    const markers = [25, 50, 75, 100];
    markers.forEach(marker => {
      if (scrollPercentage >= marker && !scrollDepthMarkers.current.has(marker)) {
        scrollDepthMarkers.current.add(marker);
        trackEvent('scroll_depth', {
          depth: marker,
          scrollPosition: scrollTop
        });
      }
    });

    lastScrollPosition.current = scrollTop;
  }, [enabled, product]);

  // Track user interactions
  const trackInteraction = useCallback((interactionType: string, details?: Record<string, any>) => {
    if (!enabled || !product) return;

    interactionCount.current += 1;
    trackEvent('user_interaction', {
      type: interactionType,
      count: interactionCount.current,
      ...details
    });
  }, [enabled, product]);

  // Generic event tracking
  const trackEvent = useCallback((eventName: string, metadata?: Record<string, any>) => {
    if (!enabled || !product) return;

    const event: AnalyticsEvent = {
      event: eventName,
      productId: product.id,
      timestamp: Date.now(),
      metadata
    };

    analyticsQueue.current.push(event);

    // Send events in batches to avoid overwhelming the server
    if (analyticsQueue.current.length >= 5) {
      flushAnalytics();
    }
  }, [enabled, product]);

  // Flush analytics queue
  const flushAnalytics = useCallback(async () => {
    if (analyticsQueue.current.length === 0) return;

    const events = [...analyticsQueue.current];
    analyticsQueue.current = [];

    try {
      // Send to analytics service (implement based on your analytics provider)
      console.log('📊 Analytics Events:', events);
      
      // Example: Send to your analytics API
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events })
      // });
    } catch (error) {
      console.error('Failed to send analytics:', error);
      // Re-queue events on failure
      analyticsQueue.current.unshift(...events);
    }
  }, []);

  // Track page visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      trackEvent('page_hidden');
      flushAnalytics(); // Flush when page becomes hidden
    } else {
      trackEvent('page_visible');
    }
  }, [trackEvent, flushAnalytics]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled || !product) return;

    // Track initial page load
    trackEvent('product_page_loaded', {
      productTitle: product.title,
      productCategory: product.categoryName,
      productPrice: product.discountedPrice || product.price
    });

    // Scroll tracking
    const handleScroll = () => trackScrollDepth();
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Click tracking
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickableElements = ['button', 'a', 'input'];
      
      if (clickableElements.some(tag => target.tagName.toLowerCase() === tag)) {
        trackInteraction('click', {
          element: target.tagName.toLowerCase(),
          text: target.textContent?.slice(0, 50) || '',
          className: target.className
        });
      }
    };
    document.addEventListener('click', handleClick);

    // Visibility change tracking
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Flush remaining events on cleanup
      flushAnalytics();
    };
  }, [enabled, product, trackEvent, trackScrollDepth, trackInteraction, handleVisibilityChange, flushAnalytics]);

  // Periodic flush
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (analyticsQueue.current.length > 0) {
        flushAnalytics();
      }
    }, 30000); // Flush every 30 seconds

    return () => clearInterval(interval);
  }, [enabled, flushAnalytics]);

  return {
    trackEvent,
    trackInteraction,
    flushAnalytics,
    getQueuedEvents: () => [...analyticsQueue.current],
    getInteractionCount: () => interactionCount.current,
    getScrollDepthMarkers: () => Array.from(scrollDepthMarkers.current)
  };
};