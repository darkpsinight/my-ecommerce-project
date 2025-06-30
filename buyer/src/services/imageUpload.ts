import axios from "axios";

interface UploadResponse {
  success: boolean;
  data: {
    url: string;
  };
  message?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Define folder paths for different image types
export const IMAGE_FOLDERS = {
  BUYER_PROFILE_IMAGES: '/buyer-profile-pictures',
};

/**
 * Upload an image to ImageKit via the backend
 * @param file - The file to upload
 * @param folder - The folder path in ImageKit.io where the image should be stored
 * @param token - Authentication token
 * @returns Promise with the uploaded image URL
 */
export const uploadImage = async (
  file: File, 
  folder: string = IMAGE_FOLDERS.BUYER_PROFILE_IMAGES,
  token: string
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    console.log('Uploading to folder:', folder);

    if (!token) {
      throw new Error('Authentication token is missing. Please log in again.');
    }

    try {
      console.log('Sending file upload request with size:', file.size, 'bytes');

      // Construct URL with properly encoded folder parameter
      const uploadUrl = new URL(`${API_URL}/images/upload`);
      uploadUrl.searchParams.append('folder', folder);

      const response = await axios.post<UploadResponse>(
        uploadUrl.toString(),
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type explicitly for multipart/form-data
            // Let axios set it with the boundary parameter
          },
          withCredentials: true, // Include cookies in the request
          timeout: 60000, // 60 seconds timeout
        } as any
      );

      console.log('Upload API response success:', response.data);

      if (response.data.success) {
        return response.data.data.url;
      } else {
        console.error('Upload API response error:', response.data);
        throw new Error(response.data.message || 'Failed to upload image');
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
  } catch (error: any) {
    console.error('Outer error:', error);
    throw error;
  }
};

/**
 * Process image to ensure consistent format and size
 * @param file - The original file
 * @returns Promise with the processed file
 */
export const processImage = async (file: File): Promise<File> => {
  try {
    // Simple client-side processing by creating a canvas
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Create a promise to handle the image loading
    return new Promise<File>((resolve, reject) => {
      img.onload = () => {
        // Calculate dimensions (max 800px width/height for profile pictures)
        const maxDimension = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDimension) {
          height = Math.round(height * (maxDimension / width));
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round(width * (maxDimension / height));
          height = maxDimension;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw the image on the canvas with the new dimensions
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob with appropriate quality
        // Use higher quality for profile pictures
        const quality = 0.9;

        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], file.name, {
              type: 'image/jpeg' // Always convert to JPEG for consistency
            });
            console.log('Processed image size:', Math.round(processedFile.size / 1024), 'KB');
            resolve(processedFile);
          } else {
            reject(new Error('Failed to process image'));
          }
        }, 'image/jpeg', quality);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for processing'));
      };

      // Load the image from the file
      img.src = URL.createObjectURL(file);
    });
  } catch (processingError) {
    console.error('Image processing error:', processingError);
    // Return the original file if processing fails
    return file;
  }
};