import axios from 'axios';
import { store } from 'src/redux/store';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// Axios instance with auth header
const getAuthAxios = () => {
  const token = store.getState().auth.token;

  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export interface ListingData {
  title: string;
  description: string;
  price: number | string;
  originalPrice?: number | string;
  categoryId: string;
  platform: string;
  region: string;
  isRegionLocked?: boolean;
  code?: string;
  expirationDate?: string;
  quantity?: number | string;
  supportedLanguages?: string[];
  thumbnailUrl?: string;
  autoDelivery?: boolean;
  tags?: string[];
  sellerNotes?: string;
  status?: string;
  // New property for adding codes to an existing listing
  newCodes?: Array<{
    code: string;
    soldStatus?: string;
    expirationDate?: string | Date | null;
  }>;
}

export interface ListingResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    externalId: string;
    title: string;
    price: number;
    platform: string;
    status: string;
  };
  error?: string;
  details?: {
    invalidPatterns?: Array<{
      regex: string;
      description?: string;
    }>;
    platform?: string;
    category?: string;
  };
}

// Create a new listing
export const createListing = async (listingData: ListingData): Promise<ListingResponse> => {
  try {
    // Ensure expirationDate is in ISO 8601 format if it exists
    if (listingData.expirationDate) {
      // Check if the date is already in ISO format (contains 'T')
      if (!listingData.expirationDate.includes('T')) {
        // Convert YYYY-MM-DD to YYYY-MM-DDT23:59:59.999Z (end of the day in UTC)
        listingData.expirationDate = `${listingData.expirationDate}T23:59:59.999Z`;
        console.log('API service fixed date format:', listingData.expirationDate);
      }
    }

    console.log('Creating listing with data:', JSON.stringify(listingData, null, 2));
    const api = getAuthAxios();
    const response = await api.post('/listings', listingData);
    console.log('Listing creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating listing:', error);

    // Handle API errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('API error response:', error.response.data);
      return {
        success: false,
        message: error.response.data.message || 'Failed to create listing',
        error: error.response.data.error
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        message: 'No response from server. Please check your connection.',
        error: 'Network error'
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        success: false,
        message: 'Request failed. Please try again.',
        error: error.message
      };
    }
  }
};

// Get all listings
export const getListings = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  platform?: string;
}) => {
  try {
    const api = getAuthAxios();
    // Convert page parameter to the backend's expected format (1-based instead of 0-based)
    const apiParams = {
      ...params,
      page: params?.page !== undefined ? params.page + 1 : 1
    };
    const response = await api.get('/listings', { params: apiParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching listings:', error);
    if (error.response) {
      return {
        success: false,
        error: error.response.data.error || 'Failed to fetch listings',
        message: error.response.data.message || 'Error occurred while fetching listings'
      };
    }
    return {
      success: false,
      error: 'Failed to fetch listings',
      message: error.message
    };
  }
};

// Get seller listings with masked codes
export const getSellerListings = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  platform?: string;
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) => {
  try {
    const api = getAuthAxios();
    // Convert page parameter to the backend's expected format (1-based instead of 0-based)
    const apiParams = {
      ...params,
      page: params?.page !== undefined ? params.page + 1 : 1
    };
    console.log('Fetching seller listings with params:', apiParams);
    const response = await api.get('/listings/seller', { params: apiParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching seller listings:', error);
    if (error.response) {
      return {
        success: false,
        error: error.response.data.error || 'Failed to fetch listings',
        message: error.response.data.message || 'Error occurred while fetching listings'
      };
    }
    return {
      success: false,
      error: 'Failed to fetch listings',
      message: error.message
    };
  }
};

// Get a single listing by ID
export const getListingById = async (id: string) => {
  try {
    const api = getAuthAxios();
    const response = await api.get(`/listings/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching listing ${id}:`, error);
    throw error;
  }
};

// Update a listing
export const updateListing = async (id: string, updateData: Partial<ListingData>) => {
  try {
    console.log(`Updating listing ${id} with data:`, updateData);

    // Check if we have newCodes to add
    if (updateData.newCodes && Array.isArray(updateData.newCodes) && updateData.newCodes.length > 0) {
      // Extract newCodes from updateData
      const newCodes = updateData.newCodes;

      // Remove newCodes from updateData to avoid sending it in the main update
      const { newCodes: _, ...cleanUpdateData } = updateData;

      // First, update the listing without the codes
      const api = getAuthAxios();
      let response;

      // Only make the main update API call if there are other fields to update
      if (Object.keys(cleanUpdateData).length > 0) {
        console.log(`Making PUT request to /listings/${id} with data:`, cleanUpdateData);
        response = await api.put(`/listings/${id}`, cleanUpdateData);
        console.log('PUT response:', response.data);
      }

      // Then, add the new codes using our addListingCodes function
      const codesResponse = await addListingCodes(id, newCodes);

      // Return the codes response if that's all we did, otherwise return the main response
      return response ? response.data : codesResponse;
    } else {
      // Regular update without new codes
      const api = getAuthAxios();
      console.log(`Making PUT request to /listings/${id} with data:`, updateData);
      const response = await api.put(`/listings/${id}`, updateData);
      console.log('PUT response:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error(`Error updating listing ${id}:`, error);
    throw error;
  }
};

// Delete a listing
export const deleteListing = async (id: string) => {
  try {
    const api = getAuthAxios();
    const response = await api.delete(`/listings/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting listing ${id}:`, error);
    throw error;
  }
};

// Interface for standardized validation error response
export interface ValidationErrorResponse {
  success: boolean;
  message: string;
  errors?: Array<{
    type: string;
    code: string;
    details: string;
    suggestion: string;
    [key: string]: any;
  }>;
  context?: {
    platform?: string;
    category?: string;
    patterns?: Array<{
      description?: string;
      example?: string;
    }>;
    [key: string]: any;
  };
  error?: any; // For backward compatibility
  data?: {
    listingId?: string;
    title?: string;
    codesAdded?: number;
    totalCodes?: number;
    [key: string]: any;
  }; // For success responses
}

// Upload codes from CSV to a listing
export const uploadCodesCSV = async (id: string, csvData: string): Promise<ValidationErrorResponse> => {
  try {
    const api = getAuthAxios();
    const response = await api.post(`/listings/${id}/upload-codes-csv`, { csvData });
    return response.data;
  } catch (error) {
    console.error(`Error uploading codes to listing ${id}:`, error);

    // Handle API errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('API error response:', error.response.data);

      // Check if it's the new standardized error format
      if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
        // Return the standardized error response directly
        return error.response.data;
      }

      // Handle legacy error format
      return {
        success: false,
        message: error.response.data.message || 'Failed to upload codes',
        error: error.response.data.error
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        success: false,
        message: 'No response from server. Please check your connection.',
        error: 'Network error'
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        success: false,
        message: 'Request failed. Please try again.',
        error: error.message
      };
    }
  }
};

// Delete a specific code from a listing
export const deleteListingCode = async (listingId: string, codeId: string) => {
  try {
    const api = getAuthAxios();
    const response = await api.delete(`/listings/${listingId}/codes/${codeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting code ${codeId} from listing ${listingId}:`, error);

    // Handle API errors
    if (error.response) {
      console.error('API error response:', error.response.data);
      return {
        success: false,
        message: error.response.data.message || 'Failed to delete code',
        error: error.response.data.error
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'No response from server. Please check your connection.',
        error: 'Network error'
      };
    } else {
      return {
        success: false,
        message: 'Request failed. Please try again.',
        error: error.message
      };
    }
  }
};

// Add codes to a listing
export const addListingCodes = async (listingId: string, codes: Array<{
  code: string;
  soldStatus?: string;
  expirationDate?: string | Date | null;
}>) => {
  try {
    const api = getAuthAxios();

    // Format expiration dates if needed
    const formattedCodes = codes.map(codeItem => {
      const formattedCode = { ...codeItem };

      if (formattedCode.expirationDate) {
        // If it's a Date object, convert to ISO string
        if (formattedCode.expirationDate instanceof Date) {
          formattedCode.expirationDate = formattedCode.expirationDate.toISOString();
        }
        // If it's a string but not in ISO format, convert it
        else if (typeof formattedCode.expirationDate === 'string' && !formattedCode.expirationDate.includes('T')) {
          formattedCode.expirationDate = `${formattedCode.expirationDate}T23:59:59.999Z`;
        }
      }

      return formattedCode;
    });

    // Use the existing updateListing endpoint with the codes property
    // Add a dummy valid field (sellerNotes) to prevent "No valid fields to update" error
    // The backend will handle adding these codes to the listing
    const response = await api.put(`/listings/${listingId}`, {
      codes: formattedCodes,
      sellerNotes: ''  // Empty string instead of undefined to ensure it's included in the request
    });
    return response.data;
  } catch (error) {
    console.error(`Error adding codes to listing ${listingId}:`, error);

    // Handle API errors
    if (error.response) {
      console.error('API error response:', error.response.data);
      return {
        success: false,
        message: error.response.data.message || 'Failed to add codes',
        error: error.response.data.error
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'No response from server. Please check your connection.',
        error: 'Network error'
      };
    } else {
      return {
        success: false,
        message: 'Request failed. Please try again.',
        error: error.message
      };
    }
  }
};

// Get all categories (for dropdown options)
export const getCategories = async () => {
  try {
    const api = getAuthAxios();
    const response = await api.get('/seller/categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return {
      success: false,
      message: error.response ? error.response.data.message || 'Failed to fetch categories' : error.message,
      error: error.response ? error.response.data.error || 'API Error' : 'Network Error'
    };
  }
};

// Get listings summary statistics
export const getListingsSummary = async () => {
  try {
    const api = getAuthAxios();
    const response = await api.get('/listings/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching listings summary:', error);
    if (error.response) {
      return {
        success: false,
        error: error.response.data.error || 'Failed to fetch listings summary',
        message: error.response.data.message || 'Error occurred while fetching listings summary'
      };
    }
    return {
      success: false,
      error: 'Failed to fetch listings summary',
      message: error.message
    };
  }
};

// Check if a code exists in any listing
export const checkCodeExists = async (code: string, excludeListingId?: string) => {
  try {
    const api = getAuthAxios();
    const params = excludeListingId ? { excludeListingId } : {};
    const response = await api.post('/listings/check-code-exists', { code }, { params });
    return response.data;
  } catch (error) {
    console.error('Error checking if code exists:', error);
    if (error.response) {
      return {
        success: false,
        error: error.response.data.error || 'Failed to check if code exists',
        message: error.response.data.message || 'Error occurred while checking if code exists'
      };
    }
    return {
      success: false,
      error: 'Failed to check if code exists',
      message: error.message
    };
  }
};
