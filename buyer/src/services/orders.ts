import axios from 'axios';

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

export interface CartItem {
  listingId: string;
  quantity: number;
}

export interface CreateOrderData {
  cartItems: CartItem[];
  paymentMethod: 'stripe' | 'wallet';
}

export interface OrderItem {
  listingId: string;
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

export interface Order {
  _id: string;
  externalId: string;
  orderItems: OrderItem[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  createdAt: string;
  deliveredAt?: string;
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

class OrdersService {
  private baseUrl = '/orders';

  async createOrder(data: CreateOrderData): Promise<CreateOrderResponse> {
    const response = await axiosInstance.post(`${this.baseUrl}/create`, data);
    return response.data;
  }

  async getBuyerOrders(params?: GetOrdersParams): Promise<GetOrdersResponse> {
    const response = await axiosInstance.get(`${this.baseUrl}/buyer`, { params });
    return response.data;
  }

  async getSellerOrders(params?: GetOrdersParams): Promise<GetOrdersResponse> {
    const response = await axiosInstance.get(`${this.baseUrl}/seller`, { params });
    return response.data;
  }
}

export const ordersApi = new OrdersService();
