import axios from "axios";
import { USER_API } from "@/config/api";

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
}

interface UserInfoResponse {
  success: boolean;
  data?: UserInfo;
  error?: string;
  message?: string;
}

export const userApi = {
  getUserInfo: async (token: string): Promise<UserInfo> => {
    try {
      const response = await axiosInstance.get<UserInfoResponse>(USER_API.INFO, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch user info');
      }

      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch user info';
      throw new Error(message);
    }
  },
}; 