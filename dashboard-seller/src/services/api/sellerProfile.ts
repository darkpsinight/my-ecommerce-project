import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// Function to get token without importing store directly
const getAuthToken = (): string | null => {
  // Use dynamic import to avoid circular dependency
  try {
    const { store } = require('src/redux/store');
    return store.getState().auth.token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Interface for badge data
 */
export interface BadgeData {
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
}

/**
 * Interface for seller profile data
 */
export interface SellerProfileData {
  nickname: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  marketName?: string;
  about?: string;
  badges?: BadgeData[];
  enterpriseDetails?: {
    companyName?: string;
    website?: string;
    socialMedia?: Array<{
      platform: string;
      url: string;
    }>;
  };
  externalId?: string;
}

/**
 * Interface for combined user and profile data
 */
export interface SellerProfileResponse {
  user: {
    name: string;
    email: string;
    role: string;
  };
  profile: SellerProfileData | null;
  hasProfile: boolean;
}

/**
 * Get the seller profile data
 * @returns Promise with the seller profile data
 */
export const getSellerProfile = async (): Promise<SellerProfileResponse> => {
  try {
    // Get token using the helper function to avoid circular dependency
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication token is missing. Please log in again.');
    }

    const response = await axios.get(
      `${API_URL}/seller/profile`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true,
        timeout: 10000 // 10 seconds timeout
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      console.error('Profile API response error:', response.data);
      throw new Error(response.data.message || 'Failed to get seller profile');
    }
  } catch (error: any) {
    console.error('Error getting seller profile:', error);

    // Add timeout handling
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }

    throw error;
  }
};

/**
 * Update the seller profile
 * @param profileData - The profile data to update
 * @returns Promise with the updated profile data
 */
export const updateSellerProfile = async (profileData: Partial<SellerProfileData>): Promise<SellerProfileData> => {
  try {
    console.log('updateSellerProfile called with data:', profileData);

    // Get token using the helper function to avoid circular dependency
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication token is missing. Please log in again.');
    }

    console.log('Making API request to:', `${API_URL}/seller/profile/extended`);
    console.log('With token:', token ? `${token.substring(0, 10)}...` : 'No token');

    const response = await axios.put(
      `${API_URL}/seller/profile/extended`,
      profileData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        timeout: 10000 // 10 seconds timeout
      }
    );

    console.log('Profile update API raw response:', response);

    if (response.data.success) {
      console.log('Profile update successful, returning data:', response.data.data);
      return response.data.data;
    } else {
      console.error('Profile update API response error:', response.data);
      throw new Error(response.data.message || 'Failed to update seller profile');
    }
  } catch (error: any) {
    console.error('Error updating seller profile:', error);

    // Log more details about the error
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    }

    // Add timeout handling
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }

    throw error;
  }
};
