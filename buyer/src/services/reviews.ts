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
        console.log('Token refreshed successfully in reviews service');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed in reviews service:', error);
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

export interface ReviewData {
  orderId: string;
  rating: number;
  comment?: string;
}

export interface Review {
  reviewerId: {
    name: string;
  };
  rating: number;
  comment: string;
  helpfulVotes: number;
  createdAt: string;
  adminResponse?: string;
  adminResponseDate?: string;
}

export interface ReviewStatistics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ListingReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  statistics: ReviewStatistics;
}

export interface CanReviewOrderResponse {
  canReview: boolean;
  reason?: string;
  existingReview?: {
    rating: number;
    comment: string;
    createdAt: string;
  };
  order?: {
    externalId: string;
    totalAmount: number;
    currency: string;
    createdAt: string;
    orderItems: Array<{
      title: string;
      platform: string;
      region: string;
      quantity: number;
      totalPrice: number;
    }>;
  };
}

class ReviewService {
  private baseUrl = '/reviews';

  /**
   * Create a new review for an order
   */
  async createReview(reviewData: ReviewData): Promise<{
    reviewId: string;
    rating: number;
    comment: string;
    createdAt: string;
  }> {
    const response = await axiosInstance.post<{
      success: boolean;
      message: string;
      data: {
        reviewId: string;
        rating: number;
        comment: string;
        createdAt: string;
      };
    }>(`${this.baseUrl}/create`, reviewData);
    return response.data.data;
  }

  /**
   * Check if user can review an order
   */
  async canUserReviewOrder(orderId: string): Promise<CanReviewOrderResponse> {
    const response = await axiosInstance.get<{
      success: boolean;
      data: CanReviewOrderResponse;
    }>(`${this.baseUrl}/can-review/${orderId}`);
    return response.data.data;
  }

  /**
   * Get reviews for a specific listing
   */
  async getListingReviews(
    listingId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'createdAt' | 'rating' | 'helpfulVotes';
      sortOrder?: 'asc' | 'desc';
      minRating?: number;
      maxRating?: number;
    } = {}
  ): Promise<ListingReviewsResponse> {
    const response = await axiosInstance.get<{
      success: boolean;
      data: ListingReviewsResponse;
    }>(`${this.baseUrl}/listing/${listingId}`, { params: options });
    return response.data.data;
  }

  /**
   * Mark a review as helpful
   */
  async markReviewAsHelpful(reviewId: string): Promise<{ helpfulVotes: number }> {
    const response = await axiosInstance.post<{
      success: boolean;
      message: string;
      data: { helpfulVotes: number };
    }>(`${this.baseUrl}/${reviewId}/helpful`);
    return response.data.data;
  }

  /**
   * Remove helpful mark from a review
   */
  async removeHelpfulMark(reviewId: string): Promise<{ helpfulVotes: number }> {
    const response = await axiosInstance.delete<{
      success: boolean;
      message: string;
      data: { helpfulVotes: number };
    }>(`${this.baseUrl}/${reviewId}/helpful`);
    return response.data.data;
  }
}

export const reviewService = new ReviewService();