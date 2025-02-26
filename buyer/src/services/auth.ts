import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export interface SignupData {
  name: string;
  email: string;
  password: string;
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

export interface SigninData {
  email: string;
  password: string;
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
    }
  }
}

const isErrorResponse = (error: any): error is { response: { data: ErrorResponse } } => {
  return error?.response?.data?.statusCode !== undefined &&
         error?.response?.data?.error !== undefined &&
         error?.response?.data?.success === false;
};

export const authApi = {
  signup: async (data: SignupData): Promise<SignupResponse> => {
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const rawData = response.data as any;
      
      // Ensure the response matches the SignupResponse interface
      const responseData: SignupResponse = {
        success: rawData.success ?? true,
        message: rawData.message ?? 'Registration successful',
        data: rawData.data
      };
      
      return responseData;
    } catch (error: any) {
      if (isErrorResponse(error)) {
        throw error;
      }
      throw {
        response: {
          data: {
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An unexpected error occurred',
            success: false
          } as ErrorResponse
        }
      };
    }
  },
  
  signin: async (data: SigninData): Promise<SigninResponse> => {
    try {
      const response = await axios.post(`${API_URL}/auth/signin`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const rawData = response.data as any;
 
      // Ensure the response matches the SigninResponse interface
      const responseData: SigninResponse = {
        success: rawData.success ?? true,
        message: rawData.message ?? 'Login successful',
        data: rawData.data
      };
      
      return responseData;
    } catch (error: any) {
      if (isErrorResponse(error)) {
        throw error;
      }
      throw {
        response: {
          data: {
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An unexpected error occurred',
            success: false
          } as ErrorResponse
        }
      };
    }
  }
}; 