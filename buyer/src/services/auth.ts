import axios from "axios";
import { AUTH_API } from '@/config/api';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: This enables sending cookies in cross-origin requests
  headers: {
    "Content-Type": "application/json",
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

// Function to refresh token using centralized manager
const refreshAuthToken = async (): Promise<boolean> => {
  try {
    // Use the centralized refresh manager
    const { authRefreshManager } = await import('./authRefreshManager');
    return await authRefreshManager.refreshToken({ source: 'auth-service-interceptor' });
  } catch (error) {
    console.error('Token refresh failed in auth service:', error);
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

      console.log('401 error detected in auth service, attempting token refresh...');
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

export interface SignupData {
  name: string;
  email: string;
  password: string;
  recaptchaToken?: string;
  acquisitionSource?: {
    channel?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    utmTerm?: string;
    referralCode?: string;
  };
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      name: string;
      email: string;
      // Add other user fields as needed
    };
    token: string;
  };
}

interface SigninApiResponse {
  statusCode: number;
  message: string;
  success: boolean;
  token: string;
  verifyToken: string;
  emailSuccess: boolean;
  emailMessage: string;
}

export interface SigninData {
  email: string;
  password: string;
  recaptchaToken?: string;
}

export interface SigninResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      name: string;
      email: string;
      // Add other user fields as needed
    };
    token: string;
    verifyToken: string;
  };
}

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  success: false;
  metadata?: {
    hint?: string;
    links?: {
      login?: string;
      passwordReset?: string;
    };
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface UserData {
  name: string;
  email: string;
  token: string;
}

const isErrorResponse = (
  error: unknown
): error is { response: { data: ErrorResponse } } => {
  return (
    error !== null &&
    typeof error === "object" &&
    "response" in error &&
    error.response !== null &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data !== null &&
    typeof error.response.data === "object" &&
    "statusCode" in error.response.data &&
    "error" in error.response.data &&
    "success" in error.response.data &&
    error.response.data.success === false
  );
};

export const authApi = {
  signup: async (data: SignupData): Promise<SignupResponse> => {
    try {
      const response = await axiosInstance.post<ApiResponse<UserData>>(
        "/auth/signup",
        data
      );
      const responseData: SignupResponse = {
        success: response.data.success ?? true,
        message: response.data.message ?? "Registration successful",
        data: response.data.data
          ? {
              user: {
                name: response.data.data.name,
                email: response.data.data.email,
              },
              token: response.data.data.token,
            }
          : undefined,
      };
      return responseData;
    } catch (error: unknown) {
      if (isErrorResponse(error)) {
        throw error;
      }
      throw {
        response: {
          data: {
            statusCode: 500,
            error: "Internal Server Error",
            message: "An unexpected error occurred",
            success: false,
          } as ErrorResponse,
        },
      };
    }
  },

  signin: async (data: SigninData): Promise<SigninResponse> => {
    try {
      const response = await axiosInstance.post<SigninApiResponse>(
        "/auth/signin",
        data
      );
      const responseData: SigninResponse = {
        success: response.data.success,
        message: response.data.message,
        data: {
          user: {
            name: "", // These can be populated if needed
            email: "",
          },
          token: response.data.token,
          verifyToken: response.data.verifyToken,
        },
      };
      return responseData;
    } catch (error: unknown) {
      if (isErrorResponse(error)) {
        throw error;
      }
      throw {
        response: {
          data: {
            statusCode: 500,
            error: "Internal Server Error",
            message: "An unexpected error occurred",
            success: false,
          } as ErrorResponse,
        },
      };
    }
  },

  forgotPassword: async (
    email: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosInstance.post<ApiResponse<never>>(
        "/auth/reset-password",
        { email }
      );
      return {
        success: response.data.success ?? true,
        message:
          response.data.message ?? "Password reset email sent successfully",
      };
    } catch (error: unknown) {
      if (isErrorResponse(error)) {
        throw error;
      }
      throw {
        response: {
          data: {
            statusCode: 500,
            error: "Internal Server Error",
            message: "An unexpected error occurred",
            success: false,
          } as ErrorResponse,
        },
      };
    }
  },
};
