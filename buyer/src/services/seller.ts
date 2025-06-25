import { Seller, SellersResponse, SellerFilters } from '@/types/seller';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Cache for sellers to prevent redundant API calls
const sellersCache: Record<string, {
  result: SellersResponse;
  timestamp: number
}> = {};

const sellerCache: Record<string, { seller: Seller; timestamp: number }> = {};
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

// In-flight requests to prevent duplicate API calls
const inFlightRequests: Record<string, Promise<SellersResponse | null>> = {};

// Get all sellers with optional filters
export const getSellers = async (filters?: SellerFilters): Promise<SellersResponse | null> => {
  // Create a cache key based on the filters
  const cacheKey = JSON.stringify(filters || {});

  // Check if we have a cached version that's still valid
  const cachedData = sellersCache[cacheKey];
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    console.log(`Using cached sellers data for filters:`, filters);
    return cachedData.result;
  }

  // Check if there's already a request in flight for this cache key
  if (inFlightRequests[cacheKey]) {
    console.log(`Request already in flight for filters:`, filters);
    return inFlightRequests[cacheKey];
  }

  try {
    console.log('Fetching sellers with filters:', filters);
    
    // Store the promise in in-flight requests
    const requestPromise = (async () => {
      try {
        const response = await api.get('/public/sellers', { params: filters });
        
        if (response.data && (response.data as ApiResponse<any>).success) {
          const responseData = (response.data as ApiResponse<any>).data;
          
          // Handle both array and paginated response formats
          let sellers: Seller[];
          let pagination: any = {};

          if (Array.isArray(responseData)) {
            // Simple array response
            sellers = responseData;
            pagination = {
              total: sellers.length,
              currentPage: 1,
              totalPages: 1,
              hasNext: false,
              hasPrevious: false
            };
          } else {
            // Paginated response
            sellers = responseData.sellers || [];
            pagination = responseData.pagination || {
              total: sellers.length,
              currentPage: 1,
              totalPages: 1,
              hasNext: false,
              hasPrevious: false
            };
          }

          // Cache individual sellers while we're at it
          sellers.forEach(seller => {
            sellerCache[seller.externalId] = {
              seller,
              timestamp: Date.now()
            };
          });

          const result: SellersResponse = {
            sellers,
            total: pagination.total || sellers.length,
            totalPages: pagination.totalPages || pagination.pages || 1,
            currentPage: pagination.currentPage || pagination.page || 1,
            hasNext: pagination.hasNext || false,
            hasPrevious: pagination.hasPrevious || false
          };

          // Cache the result
          sellersCache[cacheKey] = {
            result,
            timestamp: Date.now()
          };

          return result;
        } else {
          console.error('API response unsuccessful:', response.data);
          return null;
        }
      } catch (error: any) {
        console.error('Error fetching sellers:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Status code:', error.response.status);
        }
        return null;
      } finally {
        // Clean up the in-flight request
        delete inFlightRequests[cacheKey];
      }
    })();

    inFlightRequests[cacheKey] = requestPromise;
    return await requestPromise;
  } catch (error: any) {
    // Clean up the in-flight request in case of synchronous error
    delete inFlightRequests[cacheKey];
    console.error('Error fetching sellers:', error);
    return null;
  }
};

// Get seller by ID
export const getSellerById = async (id: string): Promise<Seller | null> => {
  // Check if we have a cached version that's still valid
  const cachedData = sellerCache[id];
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    console.log(`Using cached seller data for ID: ${id}`);
    return cachedData.seller;
  }

  try {
    console.log(`Fetching seller details for ID: ${id}`);
    const response = await api.get(`/public/seller/${id}`);

    if (response.data && (response.data as ApiResponse<Seller>).success) {
      const seller = (response.data as ApiResponse<Seller>).data;

      // Cache the seller data
      sellerCache[id] = {
        seller,
        timestamp: Date.now()
      };

      return seller;
    } else {
      console.error('API response unsuccessful:', response.data);
      return null;
    }
  } catch (error: any) {
    console.error('Error fetching seller details:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    return null;
  }
};

// Helper function to clear all caches
export const clearSellerCaches = () => {
  Object.keys(sellerCache).forEach(key => delete sellerCache[key]);
  Object.keys(sellersCache).forEach(key => delete sellersCache[key]);
  Object.keys(inFlightRequests).forEach(key => delete inFlightRequests[key]);
  console.log('Seller caches and in-flight requests cleared');
};