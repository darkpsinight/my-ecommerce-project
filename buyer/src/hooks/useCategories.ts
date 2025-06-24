import { useState, useEffect } from 'react';
import { Category } from '@/types/category';
import axios from 'axios';

// Global cache to persist between component mounts
let categoriesCache: {
  data: Category[] | null;
  timestamp: number;
} | null = null;

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// Flag to track if a request is in progress
let isRequestInProgress = false;

export function useCategories() {
  const [categories, setCategories] = useState<Category[] | null>(categoriesCache?.data || null);
  const [loading, setLoading] = useState<boolean>(!categoriesCache);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async (force: boolean = false) => {
    // If we already have cached data and it's not expired and not forced, use it
    if (!force && categoriesCache && Date.now() - categoriesCache.timestamp < CACHE_DURATION) {
      setCategories(categoriesCache.data);
      setLoading(false);
      return;
    }

    // If a request is already in progress, don't start another one
    if (isRequestInProgress) {
      return;
    }

    // Set flag to prevent duplicate requests
    isRequestInProgress = true;
    
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
      const response = await axios.get(`${API_URL}/public/categories`);
      
      // Type-safe response handling
      const responseData = response.data as {
        success?: boolean;
        data?: any[];
      };
      
      if (responseData && responseData.success && Array.isArray(responseData.data)) {
        // Transform the data to match our frontend Category type
        const transformedData = responseData.data.map((category: any) => {
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
            imageUrl: imageUrl, // Keep both for compatibility
            description: category.description
          };
        });
        
        // Update the cache
        categoriesCache = {
          data: transformedData,
          timestamp: Date.now()
        };
        
        setCategories(transformedData);
      } else {
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
      // Reset the flag when the request is complete
      isRequestInProgress = false;
    }
  };

  const refetch = () => {
    fetchCategories(true);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, error, refetch };
}
