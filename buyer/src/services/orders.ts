import axios from 'axios';
import { AUTH_API } from '@/config/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: This enables sending cookies in cross-origin requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get token from Redux store
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      // Get token from Redux store
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
      console.log('No verifyToken available for refresh');
      return false;
    }

    console.log('Attempting to refresh token...');
    const response = await fetch(AUTH_API.REFRESH_TOKEN, {
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
        // Update Redux store
        const { store } = require('@/redux/store');
        const { setTokens } = require('@/redux/features/auth-slice');
        store.dispatch(setTokens({
          token: data.token,
          verifyToken: data.verifyToken
        }));
        console.log('Token refreshed successfully in orders service');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed in orders service:', error);
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
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      console.log('401 error detected, attempting token refresh...');
      const refreshSuccess = await refreshAuthToken();

      if (refreshSuccess) {
        // Update the original request with the new token
        const newToken = getAuthToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          console.log('Retrying original request with new token');
          return axiosInstance(originalRequest);
        }
      }
    }

    return Promise.reject(error);
  }
);

export interface CartItem {
  listingId: string;
  quantity: number;
}

export interface CreateOrderData {
  cartItems: CartItem[];
  paymentMethod: 'stripe' | 'wallet';
}

export interface OrderItem {
  listing?: {
    _id: string;
    title: string;
    platform: string;
    region: string;
    description: string;
    thumbnailUrl?: string;
  };
  title: string;
  platform: string;
  region: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchasedCodes?: {
    codeId: string;
    code: string;
    expirationDate?: string;
    deliveredAt: string;
  }[];
}

export interface Seller {
  name: string;
  email: string;
}

export interface Order {
  externalId: string;
  orderItems: OrderItem[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  createdAt: string;
  deliveredAt?: string;
  seller?: Seller;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    orderId: string;
    status: string;
    totalAmount: number;
    paymentMethod: string;
    clientSecret?: string;
    paymentIntentId?: string;
  };
}

export interface GetOrdersResponse {
  success: boolean;
  message: string;
  data: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
}

export interface PurchasedCode {
  _id: string;
  externalOrderId: string;
  productName: string;
  platform: string;
  region: string;
  codeId: string;
  code: string;
  iv?: string;
  expirationDate?: string;
  purchaseDate: string;
  deliveredAt: string;
}

export interface GetPurchasedCodesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'productName' | 'platform';
  sortOrder?: 'asc' | 'desc';
}

export interface GetPurchasedCodesResponse {
  success: boolean;
  message: string;
  data: {
    codes: PurchasedCode[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      totalOrders: number;
    };
  };
}

export interface GetOrderByIdResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
  };
}

export interface DecryptCodeRequest {
  codeId: string;
  orderId: string; // This should be the externalOrderId (UUID)
}

export interface DecryptCodeResponse {
  success: boolean;
  message: string;
  data: {
    codeId: string;
    decryptedCode: string;
    expirationDate?: string;
  };
}

class OrdersService {
  private baseUrl = '/orders';

  async createOrder(data: CreateOrderData): Promise<CreateOrderResponse> {
    const response = await axiosInstance.post<CreateOrderResponse>(`${this.baseUrl}/create`, data);
    return response.data;
  }

  async getBuyerOrders(params?: GetOrdersParams): Promise<GetOrdersResponse> {
    const response = await axiosInstance.get<GetOrdersResponse>(`${this.baseUrl}/buyer`, { params });
    return response.data;
  }

  async getSellerOrders(params?: GetOrdersParams): Promise<GetOrdersResponse> {
    const response = await axiosInstance.get<GetOrdersResponse>(`${this.baseUrl}/seller`, { params });
    return response.data;
  }

  async getBuyerPurchasedCodes(params?: GetPurchasedCodesParams): Promise<GetPurchasedCodesResponse> {
    const response = await axiosInstance.get<GetPurchasedCodesResponse>(`${this.baseUrl}/buyer/codes`, { params });
    return response.data;
  }

  async getOrderById(orderId: string): Promise<GetOrderByIdResponse> {
    const response = await axiosInstance.get<GetOrderByIdResponse>(`${this.baseUrl}/${orderId}`);
    return response.data;
  }

  async decryptCode(data: DecryptCodeRequest): Promise<DecryptCodeResponse> {
    const response = await axiosInstance.post<DecryptCodeResponse>(`${this.baseUrl}/decrypt-code`, data);
    return response.data;
  }
}

export const ordersApi = new OrdersService();
