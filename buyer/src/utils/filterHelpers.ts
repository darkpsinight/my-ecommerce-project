/**
 * Helper functions for filter operations
 */

/**
 * Debounce function to limit the frequency of function calls
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Create URL search params from filter object
 */
export const createFilterParams = (filters: Record<string, any>): URLSearchParams => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "" && value !== "newest") {
      if (Array.isArray(value)) {
        // Handle array values (like price range)
        value.forEach((item, index) => {
          if (item !== null && item !== undefined && item !== "") {
            params.set(`${key}[${index}]`, item.toString());
          }
        });
      } else {
        params.set(key, value.toString());
      }
    }
  });
  
  return params;
};

/**
 * Parse URL search params back to filter object
 */
export const parseFilterParams = (searchParams: URLSearchParams): Record<string, any> => {
  const filters: Record<string, any> = {};
  
  searchParams.forEach((value, key) => {
    // Handle array parameters (like price range)
    if (key.includes('[') && key.includes(']')) {
      const baseKey = key.split('[')[0];
      const index = parseInt(key.split('[')[1].split(']')[0]);
      
      if (!filters[baseKey]) {
        filters[baseKey] = [];
      }
      
      filters[baseKey][index] = isNaN(Number(value)) ? value : Number(value);
    } else {
      // Handle regular parameters
      filters[key] = isNaN(Number(value)) ? value : Number(value);
    }
  });
  
  return filters;
};

/**
 * Check if filters are different from default values
 */
export const hasActiveFilters = (filters: {
  category?: string | null;
  platform?: string | null;
  region?: string | null;
  search?: string;
  sort?: string;
  priceRange?: [number, number];
}, defaultPriceRange?: [number, number]): boolean => {
  const {
    category,
    platform,
    region,
    search,
    sort,
    priceRange
  } = filters;

  // Check basic filters
  if (category || platform || region || (search && search.trim()) || (sort && sort !== "newest")) {
    return true;
  }

  // Check price range
  if (priceRange && defaultPriceRange) {
    return priceRange[0] !== defaultPriceRange[0] || priceRange[1] !== defaultPriceRange[1];
  }

  return false;
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
};

/**
 * Generate shareable URL with current filters
 */
export const generateShareableUrl = (filters: Record<string, any>, baseUrl: string = '/products'): string => {
  const params = createFilterParams(filters);
  const queryString = params.toString();
  
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
};

/**
 * Validate filter values
 */
export const validateFilters = (filters: Record<string, any>): Record<string, any> => {
  const validated: Record<string, any> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    switch (key) {
      case 'category':
      case 'platform':
      case 'region':
        if (typeof value === 'string' && value.trim()) {
          validated[key] = value.trim();
        }
        break;
      case 'search':
        if (typeof value === 'string' && value.trim()) {
          validated[key] = value.trim();
        }
        break;
      case 'sort':
        if (typeof value === 'string' && ['newest', 'oldest', 'price_low', 'price_high'].includes(value)) {
          validated[key] = value;
        }
        break;
      case 'priceRange':
        if (Array.isArray(value) && value.length === 2 && 
            typeof value[0] === 'number' && typeof value[1] === 'number' &&
            value[0] >= 0 && value[1] >= value[0]) {
          validated[key] = value;
        }
        break;
      case 'minPrice':
      case 'maxPrice':
        if (typeof value === 'number' && value >= 0) {
          validated[key] = value;
        }
        break;
      default:
        validated[key] = value;
    }
  });
  
  return validated;
};