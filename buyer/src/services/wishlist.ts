import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Function to get token from Redux store
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      const { store } = require('@/redux/store');
      return store.getState().authReducer.token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }
  return null;
};

// Function to get verify token from session storage
const getVerifyToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('verifyToken');
  }
  return null;
};

// Function to refresh token
const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const verifyToken = getVerifyToken();
    if (!verifyToken) {
      return false;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': verifyToken,
      },
      body: JSON.stringify({}),
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.error && data.data?.accessToken) {
        // Update token in Redux store
        const { store } = require('@/redux/store');
        const { updateToken } = require('@/redux/features/auth-slice');
        store.dispatch(updateToken(data.data.accessToken));
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshed = await refreshAuthToken();
      if (refreshed) {
        const token = getAuthToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }
      }

      // If refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export interface WishlistItem {
  id: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  status?: string;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
  categoryName?: string;
  platform?: string;
  region?: string;
  sellerId?: string;
  sellerMarketName?: string;
  quantityOfActiveCodes?: number;
  addedAt?: string;
}

export interface WishlistResponse {
  error: boolean;
  data?: {
    items: WishlistItem[];
    count: number;
  };
  message?: string;
}

export interface WishlistActionResponse {
  error: boolean;
  message?: string;
  data?: {
    itemCount: number;
  };
}

// Get user's wishlist
export const getUserWishlist = async (): Promise<WishlistResponse> => {
  try {
    const response = await axiosInstance.get('/wishlist');
    return response.data as WishlistResponse;
  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
    return {
      error: true,
      message: error.response?.data?.message || 'Failed to fetch wishlist',
    };
  }
};

// Add item to wishlist
export const addItemToWishlist = async (listingId: string): Promise<WishlistActionResponse> => {
  try {
    const response = await axiosInstance.post('/wishlist/add', {
      listingId,
    });
    return response.data as WishlistActionResponse;
  } catch (error: any) {
    console.error('Error adding item to wishlist:', error);
    return {
      error: true,
      message: error.response?.data?.message || 'Failed to add item to wishlist',
    };
  }
};

// Remove item from wishlist
export const removeItemFromWishlist = async (listingId: string): Promise<WishlistActionResponse> => {
  try {
    const response = await axiosInstance.delete(`/wishlist/remove/${listingId}`);
    return response.data as WishlistActionResponse;
  } catch (error: any) {
    console.error('Error removing item from wishlist:', error);
    return {
      error: true,
      message: error.response?.data?.message || 'Failed to remove item from wishlist',
    };
  }
};

// Clear entire wishlist
export const clearWishlist = async (): Promise<WishlistActionResponse> => {
  try {
    const response = await axiosInstance.delete('/wishlist/clear');
    return response.data as WishlistActionResponse;
  } catch (error: any) {
    console.error('Error clearing wishlist:', error);
    return {
      error: true,
      message: error.response?.data?.message || 'Failed to clear wishlist',
    };
  }
};