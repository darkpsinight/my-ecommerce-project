/**
 * Utility functions for tracking listing impressions for CTR analytics
 * Handles both authenticated and anonymous users
 */

import axios from "axios";

// Get API base URL from environment or use default
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Create axios instance for impression tracking
const impressionApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token if available
impressionApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get or create anonymous ID for tracking
const getAnonymousId = () => {
  let anonymousId = localStorage.getItem("anonymousId");
  if (!anonymousId) {
    anonymousId =
      "anon_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("anonymousId", anonymousId);
  }
  return anonymousId;
};

// Get device type
const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(userAgent)) {
    return "tablet";
  }
  if (
    /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(
      userAgent
    )
  ) {
    return "mobile";
  }
  return "desktop";
};

// Get viewport information for above/below fold analysis
const getViewportInfo = (element) => {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;

  return {
    isAboveFold: rect.top < viewportHeight && rect.bottom > 0,
    scrollPosition: window.pageYOffset || document.documentElement.scrollTop,
    viewportHeight: viewportHeight,
    elementPosition:
      rect.top + (window.pageYOffset || document.documentElement.scrollTop),
  };
};

// Track single impression
export const trackImpression = async (productId, options = {}) => {
  try {
    const {
      source = "other",
      position,
      totalItemsShown,
      searchQuery,
      category,
      platform,
      sessionId,
      pageUrl = window.location.href,
      referrer = document.referrer,
      element, // DOM element for viewport analysis
      customerLocation,
    } = options;

    console.log("📊 Tracking impression:", { productId, source, position });

    const impressionData = {
      productId,
      source,
      position,
      totalItemsShown,
      searchQuery,
      category,
      platform,
      deviceType: getDeviceType(),
      sessionId: sessionId || getAnonymousId(),
      pageUrl,
      referrer,
      viewport: getViewportInfo(element),
      customerLocation,
    };

    const response = await impressionApi.post("/impressions/track", {
      impressions: [impressionData],
      anonymousId: getAnonymousId(),
    });

    if (response.data.success) {
      console.log("✅ Impression tracked successfully:", response.data.data);
      return response.data.data.results[0];
    } else {
      console.warn("⚠️ Impression tracking failed:", response.data.message);
      return null;
    }
  } catch (error) {
    console.error(
      "❌ Error tracking impression:",
      error.response?.data || error.message
    );
    // Don't throw error to avoid breaking the user experience
    return null;
  }
};

// Track multiple impressions (for product lists)
export const trackMultipleImpressions = async (impressions, options = {}) => {
  try {
    if (!impressions || impressions.length === 0) {
      console.warn("⚠️ No impressions to track");
      return [];
    }

    console.log("📊 Tracking multiple impressions:", impressions.length);

    const impressionData = impressions.map((impression, index) => ({
      productId: impression.productId,
      source: impression.source || options.source || "other",
      position:
        impression.position !== undefined ? impression.position : index + 1,
      totalItemsShown: impression.totalItemsShown || impressions.length,
      searchQuery: impression.searchQuery || options.searchQuery,
      category: impression.category || options.category,
      platform: impression.platform || options.platform,
      deviceType: getDeviceType(),
      sessionId: impression.sessionId || options.sessionId || getAnonymousId(),
      pageUrl: window.location.href,
      referrer: document.referrer,
      viewport: getViewportInfo(impression.element),
      customerLocation: impression.customerLocation || options.customerLocation,
    }));

    const response = await impressionApi.post("/impressions/track", {
      impressions: impressionData,
      anonymousId: getAnonymousId(),
    });

    if (response.data.success) {
      console.log("✅ Multiple impressions tracked:", response.data.data);
      return response.data.data.results;
    } else {
      console.warn(
        "⚠️ Multiple impression tracking failed:",
        response.data.message
      );
      return [];
    }
  } catch (error) {
    console.error(
      "❌ Error tracking multiple impressions:",
      error.response?.data || error.message
    );
    return [];
  }
};

// Mark impression as clicked (called when user views product detail)
export const markImpressionClicked = async (productId, viewId = null) => {
  try {
    console.log("🖱️ Marking impression as clicked:", { productId, viewId });

    const response = await impressionApi.post("/impressions/click", {
      productId,
      viewId,
      anonymousId: getAnonymousId(),
    });

    if (response.data.success) {
      console.log("✅ Impression click tracked:", response.data.data);
      return response.data.data;
    } else {
      console.log("ℹ️ No recent impression found to mark as clicked");
      return null;
    }
  } catch (error) {
    console.error(
      "❌ Error marking impression as clicked:",
      error.response?.data || error.message
    );
    return null;
  }
};

// Intersection Observer for automatic impression tracking
export class ImpressionObserver {
  constructor(options = {}) {
    this.options = {
      threshold: 0.5, // 50% of element must be visible
      rootMargin: "0px",
      trackingDelay: 1000, // Wait 1 second before tracking
      ...options,
    };

    this.observer = null;
    this.trackedElements = new Map();
    this.trackingTimeouts = new Map();

    this.init();
  }

  init() {
    if (!window.IntersectionObserver) {
      console.warn(
        "IntersectionObserver not supported, falling back to manual tracking"
      );
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target;
          const productId = element.dataset.productId;

          if (!productId) return;

          if (entry.isIntersecting) {
            // Element is visible, start tracking timer
            this.startTrackingTimer(element, productId);
          } else {
            // Element is not visible, cancel tracking timer
            this.cancelTrackingTimer(productId);
          }
        });
      },
      {
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin,
      }
    );
  }

  startTrackingTimer(element, productId) {
    // Cancel existing timer if any
    this.cancelTrackingTimer(productId);

    const timeout = setTimeout(() => {
      if (!this.trackedElements.has(productId)) {
        this.trackElementImpression(element, productId);
        this.trackedElements.set(productId, true);
      }
    }, this.options.trackingDelay);

    this.trackingTimeouts.set(productId, timeout);
  }

  cancelTrackingTimer(productId) {
    const timeout = this.trackingTimeouts.get(productId);
    if (timeout) {
      clearTimeout(timeout);
      this.trackingTimeouts.delete(productId);
    }
  }

  async trackElementImpression(element, productId) {
    const impressionOptions = {
      source: element.dataset.source || "other",
      position: parseInt(element.dataset.position) || undefined,
      totalItemsShown: parseInt(element.dataset.totalItems) || undefined,
      searchQuery: element.dataset.searchQuery,
      category: element.dataset.category,
      platform: element.dataset.platform,
      element: element,
    };

    await trackImpression(productId, impressionOptions);
  }

  observe(element) {
    if (this.observer && element) {
      this.observer.observe(element);
    }
  }

  unobserve(element) {
    if (this.observer && element) {
      this.observer.unobserve(element);
      const productId = element.dataset.productId;
      if (productId) {
        this.cancelTrackingTimer(productId);
        this.trackedElements.delete(productId);
      }
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
    // Clear all timeouts
    this.trackingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.trackingTimeouts.clear();
    this.trackedElements.clear();
  }
}

// Create global impression observer instance
export const globalImpressionObserver = new ImpressionObserver();

// Debounced impression tracking to prevent excessive API calls
let impressionTrackingTimeout = null;
const pendingImpressions = new Map();

export const trackImpressionDebounced = (
  productId,
  options = {},
  delay = 2000
) => {
  // Add to pending impressions
  pendingImpressions.set(productId, { productId, ...options });

  // Clear existing timeout
  clearTimeout(impressionTrackingTimeout);

  // Set new timeout to batch track impressions
  impressionTrackingTimeout = setTimeout(async () => {
    const impressions = Array.from(pendingImpressions.values());
    pendingImpressions.clear();

    if (impressions.length > 0) {
      await trackMultipleImpressions(impressions);
    }
  }, delay);
};

/*
Usage Examples:

// Basic impression tracking
trackImpression('listing-123', { source: 'search_results', position: 1 });

// Multiple impressions (for product lists)
const impressions = products.map((product, index) => ({
  productId: product.id,
  position: index + 1
}));
trackMultipleImpressions(impressions, { source: 'category_page' });

// Automatic tracking with Intersection Observer
const observer = new ImpressionObserver();
document.querySelectorAll('[data-product-id]').forEach(element => {
  observer.observe(element);
});

// Mark as clicked when user navigates to product
markImpressionClicked('listing-123', 'view-id-456');

// Debounced tracking (useful for scroll-based lists)
trackImpressionDebounced('listing-123', { source: 'homepage_featured' });
*/
