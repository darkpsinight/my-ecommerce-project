import { Product } from '@/types/product';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Cache for product details to prevent redundant API calls
const productCache: Record<string, { product: Product; timestamp: number }> = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

// Track in-flight requests to prevent duplicate API calls
const pendingRequests: Record<string, Promise<Product | null>> = {};

// Get product details by ID
export const getProductById = async (id: string, bypassCache: boolean = false): Promise<Product | null> => {
  // Generate a unique request key that includes the bypass cache flag
  const requestKey = `${id}-${bypassCache}`;

  // If there's already a pending request for this ID with the same cache settings, return that promise
  if (pendingRequests[requestKey]) {
    console.log(`Using pending request for ID: ${id}`);
    return pendingRequests[requestKey];
  }

  // Check if we have a cached version that's still valid (unless bypassCache is true)
  const cachedData = productCache[id];
  if (!bypassCache && cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    console.log(`Using cached product data for ID: ${id}`);
    return cachedData.product;
  }

  // Create a new request promise and store it
  const requestPromise = (async () => {
    try {
      console.log(`Fetching product details for ID: ${id}${bypassCache ? ' (bypassing cache)' : ''}`);
      const response = await api.get(`/listings/${id}`, {
        headers: {
          // Add a cache-busting query parameter when bypassCache is true
          'Cache-Control': bypassCache ? 'no-cache, no-store, must-revalidate' : undefined,
          'Pragma': bypassCache ? 'no-cache' : undefined,
          'Expires': bypassCache ? '0' : undefined
        }
      });

      if (response.data && response.data.success) {
        // Transform backend data to match our Product type
        const listing = response.data.data;

        // Create a product object from the listing data
        const product = {
          id: listing.externalId,
          title: listing.title,
          description: listing.description || '',
          price: listing.originalPrice || listing.price, // Original price for strikethrough
          discountedPrice: listing.price, // Current discounted price
          originalPrice: listing.originalPrice,
          categoryId: listing.categoryId,
          categoryName: listing.categoryName,
          platform: listing.platform,
          region: listing.region,
          isRegionLocked: listing.isRegionLocked,
          supportedLanguages: listing.supportedLanguages || ['English'],
          thumbnailUrl: listing.thumbnailUrl,
          autoDelivery: listing.autoDelivery,
          tags: listing.tags || [],
          status: listing.status,
          reviews: 0, // Default value as backend doesn't have reviews yet
          quantityOfActiveCodes: listing.quantityOfActiveCodes || 0,
          quantityOfAllCodes: listing.quantityOfAllCodes || 0,
          imgs: {
            // Use thumbnailUrl for both if no separate images are provided
            thumbnails: listing.thumbnailUrl ? [listing.thumbnailUrl, listing.thumbnailUrl] : ['/images/products/placeholder.png', '/images/products/placeholder.png'],
            previews: listing.thumbnailUrl ? [listing.thumbnailUrl, listing.thumbnailUrl] : ['/images/products/placeholder.png', '/images/products/placeholder.png']
          },
          // Add seller information
          sellerId: listing.sellerId || '',
          // For now, hardcode the seller name as "Michael" as requested
          sellerName: "Michael",
          // Set seller as verified
          isSellerVerified: true
        };

        // Cache the product data (even if bypassCache is true, we still want to cache the fresh data)
        productCache[id] = {
          product,
          timestamp: Date.now()
        };

        return product;
      } else {
        console.error('API response unsuccessful:', response.data);
        return null;
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      return null;
    } finally {
      // Clean up the pending request after it completes
      delete pendingRequests[requestKey];
    }
  })();

  // Store the promise so other calls can use it
  pendingRequests[requestKey] = requestPromise;

  return requestPromise;
};

// Cache for product listings to prevent redundant API calls
const listingsCache: Record<string, {
  result: { products: Product[]; total: number; page: number; totalPages: number };
  timestamp: number
}> = {};

// Get all products with optional filters
export const getProducts = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  platform?: string;
  category?: string;
}): Promise<{ products: Product[]; total: number; page: number; totalPages: number } | null> => {
  // Create a cache key based on the params
  const cacheKey = JSON.stringify(params || {});

  // Check if we have a cached version that's still valid
  const cachedData = listingsCache[cacheKey];
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    console.log(`Using cached products data for params:`, params);
    return cachedData.result;
  }

  try {
    console.log('Fetching products with params:', params);
    const response = await api.get('/listings', { params });

    if (response.data && response.data.success) {
      const listings = response.data.data.listings;

      const products = listings.map(listing => ({
        id: listing.externalId,
        title: listing.title,
        description: listing.description || '',
        price: listing.originalPrice || listing.price, // Original price for strikethrough
        discountedPrice: listing.price, // Current discounted price
        originalPrice: listing.originalPrice,
        categoryId: listing.categoryId,
        categoryName: listing.categoryName,
        platform: listing.platform,
        region: listing.region,
        isRegionLocked: listing.isRegionLocked,
        supportedLanguages: listing.supportedLanguages || ['English'],
        thumbnailUrl: listing.thumbnailUrl,
        autoDelivery: listing.autoDelivery,
        tags: listing.tags || [],
        status: listing.status,
        reviews: 0,
        quantityOfActiveCodes: listing.quantityOfActiveCodes || 0,
        quantityOfAllCodes: listing.quantityOfAllCodes || 0,
        imgs: {
          thumbnails: listing.thumbnailUrl ? [listing.thumbnailUrl, listing.thumbnailUrl] : ['/images/products/placeholder.png', '/images/products/placeholder.png'],
          previews: listing.thumbnailUrl ? [listing.thumbnailUrl, listing.thumbnailUrl] : ['/images/products/placeholder.png', '/images/products/placeholder.png']
        },
        // Add seller information
        sellerId: listing.sellerId || '',
        sellerName: "Michael", // Hardcoded as requested
        isSellerVerified: true // All sellers are verified for now
      }));

      // Also cache individual products while we're at it
      products.forEach(product => {
        productCache[product.id] = {
          product,
          timestamp: Date.now()
        };
      });

      const result = {
        products,
        total: response.data.data.pagination?.total || products.length,
        page: response.data.data.pagination?.page || 1,
        totalPages: response.data.data.pagination?.pages || 1
      };

      // Cache the result
      listingsCache[cacheKey] = {
        result,
        timestamp: Date.now()
      };

      return result;
    } else {
      console.error('API response unsuccessful:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    return null;
  }
};
