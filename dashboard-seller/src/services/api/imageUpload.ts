import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

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

// Define folder paths for different image types
export const IMAGE_FOLDERS = {
  PRODUCT_THUMBNAILS: '/listing-thumbnails',
  CATEGORY_IMAGES: '/categories-placeholder-pictures',
  SELLER_PROFILE_IMAGES: '/seller-profile-pictures',
  SELLER_BANNER_IMAGES: '/seller-profile-banners'
};

/**
 * Upload an image to ImageKit via the backend
 * @param file - The file to upload
 * @param folder - The folder path in ImageKit.io where the image should be stored
 * @returns Promise with the uploaded image URL
 */
export const uploadImage = async (file: File, folder: string = IMAGE_FOLDERS.PRODUCT_THUMBNAILS): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Get token using the helper function to avoid circular dependency
    const token = getAuthToken();

    // Debug log to check token
    console.log('Image upload - Auth token:', token ? `${token.substring(0, 10)}...` : 'No token');

    // Ensure folder path is properly formatted (no spaces)
    folder = folder.trim().replace(/\s+/g, '-').toLowerCase();
    console.log('Uploading to folder:', folder);

    if (!token) {
      throw new Error('Authentication token is missing. Please log in again.');
    }

    // Create a cancellation token
    const source = axios.CancelToken.source();

    // Set a timeout to cancel the request after 60 seconds
    const timeoutId = setTimeout(() => {
      source.cancel('Upload took too long and was cancelled');
    }, 60000);

    try {
      // Create a new FormData with just the file
      // This ensures we're sending the simplest possible request
      const simpleFormData = new FormData();
      simpleFormData.append('file', file);

      console.log('Sending file upload request with size:', file.size, 'bytes');

      // Construct URL with properly encoded folder parameter
      const uploadUrl = new URL(`${API_URL}/images/upload`);
      uploadUrl.searchParams.append('folder', folder);

      const response = await axios.post(
        uploadUrl.toString(),
        simpleFormData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type explicitly for multipart/form-data
            // Let axios set it with the boundary parameter
          },
          withCredentials: true, // Include cookies in the request
          timeout: 60000, // 60 seconds timeout
          cancelToken: source.token,
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        }
      );

      // Clear the timeout since the request completed
      clearTimeout(timeoutId);

      console.log('Upload API response success:', response.data);

      if (response.data.success) {
        return response.data.data.url;
      } else {
        console.error('Upload API response error:', response.data);
        throw new Error(response.data.message || 'Failed to upload image');
      }
    } catch (error) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error: any) {
    console.error('Error uploading image:', error);

    // Add timeout handling
    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload request timed out. Please try again with a smaller image.');
    }

    // Add more detailed error information
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      throw error;
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      throw new Error('No response received from server. Please check your connection and try again.');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw error;
    }
  }
};

/**
 * Get ImageKit authentication parameters for client-side uploads
 * @returns Promise with authentication parameters
 */
export const getImageKitAuthParams = async () => {
  try {
    // Get token using the helper function to avoid circular dependency
    const token = getAuthToken();

    // Debug log to check token
    console.log('Auth params - Auth token:', token ? `${token.substring(0, 10)}...` : 'No token');

    if (!token) {
      throw new Error('Authentication token is missing. Please log in again.');
    }

    const response = await axios.get(
      `${API_URL}/images/auth-params`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true, // Include cookies in the request
        timeout: 10000 // 10 seconds timeout
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      console.error('Auth params API response error:', response.data);
      throw new Error(response.data.message || 'Failed to get authentication parameters');
    }
  } catch (error: any) {
    console.error('Error getting ImageKit auth params:', error);

    // Add timeout handling
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please try again.');
    }

    // Add more detailed error information
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received from server');
      throw new Error('No response received from server. Please check your connection.');
    }

    throw error;
  }
};
