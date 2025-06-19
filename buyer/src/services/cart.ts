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
      if (data.token && data.verifyToken) {
        const { store } = require('@/redux/store');
        const { setTokens } = require('@/redux/features/auth-slice');
        store.dispatch(setTokens({
          token: data.token,
          verifyToken: data.verifyToken
        }));
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Add request interceptor to include auth token
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

// Add response interceptor to handle 401 errors and retry with token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshSuccess = await refreshAuthToken();
      if (refreshSuccess) {
        const newToken = getAuthToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface CartItem {
  id: string;
  listingId: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs: {
    thumbnails: string[];
    previews: string[];
  };
  sellerId: string;
  sellerName?: string;
  listingSnapshot?: {
    category?: string;
    subcategory?: string;
    platform?: string;
    region?: string;
  };
}

export interface Cart {
  userId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  lastUpdated: string;
  createdAt: string;
}

export interface CartSummary {
  totalItems: number;
  totalAmount: number;
  itemCount: number;
}

export interface AddToCartRequest {
  listingId: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity?: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
  sellerId: string;
  listingSnapshot?: {
    category?: string;
    subcategory?: string;
    platform?: string;
    region?: string;
  };
}

export interface UpdateCartItemRequest {
  listingId: string;
  quantity: number;
}

export interface RemoveFromCartRequest {
  listingId: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const cartApi = {
  // Get user's cart
  getCart: async (): Promise<Cart> => {
    try {
      const response = await axiosInstance.get<ApiResponse<Cart>>('/cart');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch cart');
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      throw error.response?.data || error;
    }
  },

  // Get cart summary
  getCartSummary: async (): Promise<CartSummary> => {
    try {
      const response = await axiosInstance.get<ApiResponse<CartSummary>>('/cart/summary');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch cart summary');
    } catch (error: any) {
      console.error('Error fetching cart summary:', error);
      throw error.response?.data || error;
    }
  },

  // Add item to cart
  addToCart: async (item: AddToCartRequest): Promise<Cart> => {
    try {
      const response = await axiosInstance.post<ApiResponse<Cart>>('/cart/add', item);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to add item to cart');
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      throw error.response?.data || error;
    }
  },

  // Update cart item quantity
  updateCartItem: async (update: UpdateCartItemRequest): Promise<Cart> => {
    try {
      const response = await axiosInstance.put<ApiResponse<Cart>>('/cart/update', update);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update cart item');
    } catch (error: any) {
      console.error('Error updating cart item:', error);
      throw error.response?.data || error;
    }
  },

  // Remove item from cart
  removeFromCart: async (item: RemoveFromCartRequest): Promise<Cart> => {
    try {
      const response = await axiosInstance.delete<ApiResponse<Cart>>('/cart/remove', {
        data: item
      });
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to remove item from cart');
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      throw error.response?.data || error;
    }
  },

  // Clear entire cart
  clearCart: async (): Promise<Cart> => {
    try {
      const response = await axiosInstance.delete<ApiResponse<Cart>>('/cart/clear');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to clear cart');
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      throw error.response?.data || error;
    }
  },
};