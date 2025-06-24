import axios from 'axios';
import { Category } from '@/types/category';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Get all active categories
export const getCategories = async (): Promise<Category[] | null> => {
  try {
    const response = await api.get('/public/categories');

    // Type-safe response handling
    const responseData = response.data as {
      success?: boolean;
      data?: any[];
    };

    if (responseData && responseData.success && Array.isArray(responseData.data)) {
      // Transform the data to match our frontend Category type
      return responseData.data.map((category: any) => {
        // Handle image URL - ensure it's properly formatted or use fallback
        let imageUrl = category.imageUrl;

        // If imageUrl is null/undefined or empty, use fallback
        if (!imageUrl) {
          imageUrl = `/images/categories/categories-01.png`;
        }
        // If it's a relative path, ensure it starts with /
        else if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
          imageUrl = `/${imageUrl}`;
        }

        return {
          id: category._id,
          title: category.name,
          img: imageUrl,
          description: category.description
        };
      });
    }

    console.error('Invalid category data format:', response.data);
    return null;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return null;
  }
};
