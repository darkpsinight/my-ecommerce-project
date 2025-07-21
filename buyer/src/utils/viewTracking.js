/**
 * Utility functions for tracking product views
 * Handles both authenticated and anonymous users
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1';

// Generate or get anonymous user ID
const getAnonymousId = () => {
  let anonymousId = localStorage.getItem('anonymousUserId');
  if (!anonymousId) {
    anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('anonymousUserId', anonymousId);
  }
  return anonymousId;
};

// Get session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Detect device type
const getDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
};

// Track product view
export const trackProductView = async (productId, options = {}) => {
  try {
    const {
      source = 'direct',
      referrer = document.referrer,
      viewDuration = null
    } = options;

    const metadata = {
      source,
      deviceType: getDeviceType(),
      sessionId: getSessionId(),
      referrer,
      viewDuration
    };

    // Check if user is authenticated
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    if (token) {
      // Authenticated user
      const response = await axios.post(
        `${API_BASE_URL}/viewed-products`,
        {
          productId,
          metadata
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ View tracked for authenticated user:', response.data);
    } else {
      // Anonymous user
      const response = await axios.post(
        `${API_BASE_URL}/viewed-products/anonymous`,
        {
          productId,
          anonymousId: getAnonymousId(),
          metadata
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ View tracked for anonymous user:', response.data);
    }
  } catch (error) {
    console.error('❌ Error tracking product view:', error.response?.data || error.message);
    // Don't throw error to avoid breaking the user experience
  }
};

// Track view with timing
export const trackProductViewWithTiming = (productId, options = {}) => {
  const startTime = Date.now();
  
  // Track initial view
  trackProductView(productId, options);
  
  // Return function to track view duration when user leaves
  return () => {
    const viewDuration = Date.now() - startTime;
    if (viewDuration > 1000) { // Only track if viewed for more than 1 second
      trackProductView(productId, {
        ...options,
        viewDuration
      });
    }
  };
};

// Debounced view tracking to prevent excessive API calls
let viewTrackingTimeout = null;
export const trackProductViewDebounced = (productId, options = {}, delay = 2000) => {
  clearTimeout(viewTrackingTimeout);
  viewTrackingTimeout = setTimeout(() => {
    trackProductView(productId, options);
  }, delay);
};

// Track multiple products (for category/search pages)
export const trackMultipleProductViews = async (productIds, options = {}) => {
  const promises = productIds.map(productId => 
    trackProductView(productId, { ...options, source: 'category' })
  );
  
  try {
    await Promise.allSettled(promises);
    console.log(`✅ Tracked views for ${productIds.length} products`);
  } catch (error) {
    console.error('❌ Error tracking multiple product views:', error);
  }
};

// Usage examples:
/*
// Basic usage
trackProductView('listing-123');

// With source tracking
trackProductView('listing-123', { source: 'search' });

// With timing
const stopTracking = trackProductViewWithTiming('listing-123', { source: 'homepage' });
// Call stopTracking() when user leaves the page

// Debounced (useful for scroll-based tracking)
trackProductViewDebounced('listing-123', { source: 'category' });
*/