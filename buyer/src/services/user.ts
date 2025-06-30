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
  bio?: string;
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  createdAt?: string;
}

interface UserInfoResponse {
  statusCode: number;
  message: string;
  success: boolean;
  role?: string;
  email: string;
  name: string;
  isEmailConfirmed: boolean;
  bio?: string;
  phone?: string;
  dateOfBirth?: string;
  profilePicture?: string;
  createdAt?: string;
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
        role: response.data.role || 'user',
        isEmailConfirmed: response.data.isEmailConfirmed,
        bio: response.data.bio || '',
        phone: response.data.phone || '',
        dateOfBirth: response.data.dateOfBirth || '',
        profilePicture: response.data.profilePicture || '',
        createdAt: response.data.createdAt || '',
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch user info';
      throw new Error(message);
    }
  },

  updateProfile: async (token: string, profileData: {
    name?: string;
    bio?: string;
    phone?: string;
    dateOfBirth?: string;
    profilePicture?: string;
  }): Promise<UserInfo> => {
    try {
      const response = await axiosInstance.put<{
        statusCode: number;
        message: string;
        success: boolean;
        profile: UserInfo;
      }>(AUTH_API.UPDATE_PROFILE, profileData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update profile');
      }

      return response.data.profile;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update profile';
      throw new Error(message);
    }
  },
}; 