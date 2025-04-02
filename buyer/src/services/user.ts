import axios from "axios";
import { AUTH_API } from "@/config/api";

// Create an axios instance with default config
const axiosInstance = axios.create({
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface UserInfo {
  email: string;
  name: string;
  role: string;
  isEmailConfirmed: boolean;
}

interface UserInfoResponse {
  statusCode: number;
  message: string;
  success: boolean;
  role: string;
  email: string;
  name: string;
  isEmailConfirmed: boolean;
}

export const userApi = {
  getUserInfo: async (token: string): Promise<UserInfo> => {
    try {
      const response = await axiosInstance.get<UserInfoResponse>(AUTH_API.ACCOUNT, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch user info');
      }

      return {
        email: response.data.email,
        name: response.data.name,
        role: response.data.role,
        isEmailConfirmed: response.data.isEmailConfirmed,
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch user info';
      throw new Error(message);
    }
  },
}; 