import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface FilterOptions {
  categories: FilterOption[];
  platforms: FilterOption[];
  regions: FilterOption[];
  priceRange: {
    min: number;
    max: number;
  };
}

export interface PriceRange {
  min: number;
  max: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Cache for filter options (since they don't change frequently)
let filterOptionsCache: { data: FilterOptions; timestamp: number } | null = null;
const FILTER_OPTIONS_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Cache for price ranges (shorter cache for dynamic data)
const priceRangeCache: Record<string, { data: PriceRange; timestamp: number }> = {};
const PRICE_RANGE_CACHE_EXPIRY = 1 * 60 * 1000; // 1 minute

// Prevent concurrent requests
let filterOptionsPromise: Promise<FilterOptions | null> | null = null;

/**
 * Get dynamic filter options based on active listings
 */
export const getFilterOptions = async (): Promise<FilterOptions | null> => {
  // Check cache first
  if (filterOptionsCache && Date.now() - filterOptionsCache.timestamp < FILTER_OPTIONS_CACHE_EXPIRY) {
    console.log('Using cached filter options');
    return filterOptionsCache.data;
  }

  // If there's already a request in progress, wait for it
  if (filterOptionsPromise) {
    console.log('Waiting for existing filter options request');
    return filterOptionsPromise;
  }

  // Create new request promise
  filterOptionsPromise = (async () => {
    try {
      console.log('Fetching filter options from API');
      const response = await api.get<ApiResponse<FilterOptions>>('/public/filter-options');

      if (response.data && response.data.success) {
        const rawData = response.data.data;
        
        // Transform backend data to match frontend interface
        const data: FilterOptions = {
          categories: rawData.categories.map((cat: any) => ({
            value: cat._id,
            label: cat.name,
            count: cat.count
          })),
          platforms: rawData.platforms.map((platform: any) => ({
            value: platform.name,
            label: platform.name,
            count: platform.count
          })),
          regions: rawData.regions.map((region: any) => ({
            value: region.name,
            label: region.name,
            count: region.count
          })),
          priceRange: rawData.priceRange
        };
        
        // Cache the result
        filterOptionsCache = {
          data,
          timestamp: Date.now()
        };

        return data;
      } else {
        console.error('Failed to fetch filter options:', response.data);
        return null;
      }
    } catch (error: any) {
      console.error('Error fetching filter options:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Status code:', error.response.status);
      }
      return null;
    } finally {
      // Clear the promise so future requests can be made
      filterOptionsPromise = null;
    }
  })();

  return filterOptionsPromise;
};

/**
 * Get price range for filtered results
 */
export const getPriceRange = async (filters?: {
  categoryId?: string;
  platform?: string;
  region?: string;
  search?: string;
}): Promise<PriceRange | null> => {
  // Create cache key based on filters
  const cacheKey = JSON.stringify(filters || {});
  
  // Check cache first
  const cachedData = priceRangeCache[cacheKey];
  if (cachedData && Date.now() - cachedData.timestamp < PRICE_RANGE_CACHE_EXPIRY) {
    console.log('Using cached price range for filters:', filters);
    return cachedData.data;
  }

  try {
    console.log('Fetching price range from API with filters:', filters);
    const response = await api.get<ApiResponse<PriceRange>>('/public/price-range', { params: filters });

    if (response.data && response.data.success) {
      const data: PriceRange = response.data.data;
      
      // Cache the result
      priceRangeCache[cacheKey] = {
        data,
        timestamp: Date.now()
      };

      return data;
    } else {
      console.error('Failed to fetch price range:', response.data);
      return null;
    }
  } catch (error: any) {
    console.error('Error fetching price range:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    return null;
  }
};

/**
 * Clear filter caches
 */
export const clearFilterCaches = () => {
  filterOptionsCache = null;
  Object.keys(priceRangeCache).forEach(key => delete priceRangeCache[key]);
  console.log('Filter caches cleared');
};