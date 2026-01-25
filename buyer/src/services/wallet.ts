import axios from 'axios';
import { WALLET_API } from '@/config/api';

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

// Types
export interface WalletData {
  externalId: string;
  balance: number;
  currency: string;
  totalFunded: number;
  totalSpent: number;
  lastFundedAt?: string;
  lastSpentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionData {
  externalId: string;
  type: 'wallet_credit_placeholder' | 'wallet_debit_purchase' | 'wallet_credit_deposit' | 'funding' | 'purchase' | 'refund' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  description: string;
  balanceBefore?: number;
  balanceAfter?: number;
  createdAt: string;
  processedAt?: string;
}

export interface WalletResponse {
  success: boolean;
  message: string;
  data: {
    wallet: WalletData;
    recentTransactions: TransactionData[];
  };
}

export interface FundWalletData {
  amount: number;
  currency: string;
}

export interface FundWalletResponse {
  success: boolean;
  message?: string;
  data: {
    balance?: number;
    paymentIntentId: string;
    clientSecret?: string;
    requiresConfirmation?: boolean;
  };
}

// ... keeping other legacy interfaces for safety ...
export interface PaymentIntentResponse {
  success: boolean;
  message: string;
  data: {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
  };
}

export interface ConfirmPaymentResponse {
  success: boolean;
  message: string;
  data: {
    transaction: TransactionData;
    newBalance: number;
  };
}

export interface TransactionsResponse {
  success: boolean;
  message: string;
  data: {
    transactions: TransactionData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface CreateCheckoutSessionData {
  amount: number;
  currency?: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  message: string;
  data: {
    sessionId: string;
    clientSecret: string;
    amount: number;
    currency: string;
  };
}

export interface CreatePaymentIntentData {
  amount: number;
  currency?: string;
}

export interface ConfirmPaymentData {
  paymentIntentId: string;
}

export interface GetTransactionsParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

// API functions
export const walletApi = {
  // Get wallet information
  getWallet: async (): Promise<WalletResponse> => {
    try {
      const response = await axiosInstance.get<WalletResponse>(WALLET_API.GET_WALLET);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to fetch wallet information',
        statusCode: 500
      };
    }
  },

  // Fund wallet directly
  fundWallet: async (data: FundWalletData): Promise<FundWalletResponse> => {
    try {
      const response = await axiosInstance.post<FundWalletResponse>(
        WALLET_API.FUND,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to find wallet',
        statusCode: 500
      };
    }
  },

  // Create payment intent for wallet funding
  createPaymentIntent: async (data: CreatePaymentIntentData): Promise<PaymentIntentResponse> => {
    try {
      const response = await axiosInstance.post<PaymentIntentResponse>(
        WALLET_API.CREATE_PAYMENT_INTENT,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to create payment intent',
        statusCode: 500
      };
    }
  },

  // Confirm payment and update wallet
  confirmPayment: async (data: ConfirmPaymentData): Promise<ConfirmPaymentResponse> => {
    try {
      const response = await axiosInstance.post<ConfirmPaymentResponse>(
        WALLET_API.CONFIRM_PAYMENT,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to confirm payment',
        statusCode: 500
      };
    }
  },

  // Create Stripe Checkout session for wallet funding
  createCheckoutSession: async (data: CreateCheckoutSessionData): Promise<CheckoutSessionResponse> => {
    try {
      const response = await axiosInstance.post<CheckoutSessionResponse>(
        WALLET_API.CREATE_CHECKOUT_SESSION,
        data
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to create checkout session',
        statusCode: 500
      };
    }
  },

  // Get transaction history
  getTransactions: async (params?: GetTransactionsParams): Promise<TransactionsResponse> => {
    try {
      const response = await axiosInstance.get<TransactionsResponse>(
        WALLET_API.GET_TRANSACTIONS,
        { params }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || {
        success: false,
        message: 'Failed to fetch transaction history',
        statusCode: 500
      };
    }
  }
};

export default walletApi;
