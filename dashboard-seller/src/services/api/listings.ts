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
  code: string;
  expirationDate?: string;
  quantity?: number | string;
  supportedLanguages?: string[];
  thumbnailUrl?: string;
  autoDelivery?: boolean;
  tags?: string[];
  sellerNotes?: string;
  status?: string;
}

export interface ListingResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
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
    const api = getAuthAxios();
    const response = await api.put(`/listings/${id}`, updateData);
    return response.data;
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
