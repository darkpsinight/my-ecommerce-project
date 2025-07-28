import { useEffect, useRef, useCallback } from 'react';
import { Product } from '@/types/product';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
}

interface UseProductPerformanceOptions {
  product: Product | null;
  enabled?: boolean;
}

export const useProductPerformance = ({ 
  product, 
  enabled = true 
}: UseProductPerformanceOptions) => {
  const startTime = useRef<number>(Date.now());
  const renderStartTime = useRef<number>(Date.now());
  const firstInteractionTime = useRef<number | null>(null);
  const metrics = useRef<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0
  });

  // Measure component render time
  const measureRenderTime = useCallback(() => {
    if (!enabled) return;

    const renderTime = Date.now() - renderStartTime.current;
    metrics.current.renderTime = renderTime;

    console.log(`🎯 Product component render time: ${renderTime}ms`);
  }, [enabled]);

  // Measure first interaction time
  const measureFirstInteraction = useCallback(() => {
    if (!enabled || firstInteractionTime.current !== null) return;

    firstInteractionTime.current = Date.now();
    const interactionTime = firstInteractionTime.current - startTime.current;
    metrics.current.interactionTime = interactionTime;

    console.log(`👆 First interaction time: ${interactionTime}ms`);
  }, [enabled]);

  // Measure memory usage (if available)
  const measureMemoryUsage = useCallback(() => {
    if (!enabled || !('memory' in performance)) return;

    const memory = (performance as any).memory;
    if (memory) {
      metrics.current.memoryUsage = memory.usedJSHeapSize;
      console.log(`💾 Memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    }
  }, [enabled]);

  // Get Web Vitals metrics
  const measureWebVitals = useCallback(() => {
    if (!enabled || !('getEntriesByType' in performance)) return;

    // Measure Largest Contentful Paint (LCP)
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      const lcp = lcpEntries[lcpEntries.length - 1] as any;
      console.log(`🖼️ Largest Contentful Paint: ${lcp.startTime.toFixed(2)}ms`);
    }

    // Measure First Input Delay (FID) - approximation
    const firstInputEntries = performance.getEntriesByType('first-input');
    if (firstInputEntries.length > 0) {
      const fid = firstInputEntries[0] as any;
      console.log(`⚡ First Input Delay: ${(fid.processingStart - fid.startTime).toFixed(2)}ms`);
    }

    // Measure Cumulative Layout Shift (CLS) - approximation
    const layoutShiftEntries = performance.getEntriesByType('layout-shift');
    if (layoutShiftEntries.length > 0) {
      const cls = layoutShiftEntries.reduce((sum: number, entry: any) => {
        return sum + (entry.hadRecentInput ? 0 : entry.value);
      }, 0);
      console.log(`📐 Cumulative Layout Shift: ${cls.toFixed(4)}`);
    }
  }, [enabled]);

  // Send performance metrics to monitoring service
  const sendMetrics = useCallback(async () => {
    if (!enabled || !product) return;

    const finalMetrics = {
      ...metrics.current,
      loadTime: Date.now() - startTime.current,
      productId: product.id,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType || 'unknown'
    };

    try {
      console.log('📊 Performance Metrics:', finalMetrics);
      
      // Send to your monitoring service
      // await fetch('/api/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(finalMetrics)
      // });
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }, [enabled, product]);

  // Set up performance monitoring
  useEffect(() => {
    if (!enabled || !product) return;

    // Measure render time after component mounts
    const renderTimer = setTimeout(measureRenderTime, 0);

    // Set up interaction listeners
    const handleFirstInteraction = () => {
      measureFirstInteraction();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('scroll', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    document.addEventListener('scroll', handleFirstInteraction, { once: true, passive: true });

    // Measure memory usage periodically
    const memoryInterval = setInterval(measureMemoryUsage, 10000); // Every 10 seconds

    // Measure Web Vitals after page load
    const webVitalsTimer = setTimeout(measureWebVitals, 2000);

    // Send metrics when component unmounts
    return () => {
      clearTimeout(renderTimer);
      clearTimeout(webVitalsTimer);
      clearInterval(memoryInterval);
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('scroll', handleFirstInteraction);
      
      sendMetrics();
    };
  }, [enabled, product, measureRenderTime, measureFirstInteraction, measureMemoryUsage, measureWebVitals, sendMetrics]);

  // Performance observer for more detailed metrics
  useEffect(() => {
    if (!enabled || !('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log(`🚀 Navigation timing: ${entry.duration.toFixed(2)}ms`);
        } else if (entry.entryType === 'resource') {
          if (entry.name.includes('product') || entry.name.includes('image')) {
            console.log(`📦 Resource load: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }

    return () => observer.disconnect();
  }, [enabled]);

  return {
    getMetrics: () => ({ ...metrics.current }),
    measureRenderTime,
    measureFirstInteraction,
    measureMemoryUsage,
    sendMetrics
  };
};