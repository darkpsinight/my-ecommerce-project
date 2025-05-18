import { Product } from '@/types/product';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Get product details by ID
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const response = await api.get(`/listings/${id}`);
    
    if (response.data && response.data.success) {
      // Transform backend data to match our Product type
      const listing = response.data.data;
      return {
        id: listing.externalId,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        discountedPrice: listing.originalPrice ? listing.price : listing.price, // If no original price, use price as discounted
        originalPrice: listing.originalPrice,
        categoryId: listing.categoryId,
        categoryName: listing.categoryName,
        platform: listing.platform,
        region: listing.region,
        isRegionLocked: listing.isRegionLocked,
        supportedLanguages: listing.supportedLanguages,
        thumbnailUrl: listing.thumbnailUrl,
        autoDelivery: listing.autoDelivery,
        tags: listing.tags,
        status: listing.status,
        reviews: 0, // Default value as backend doesn't have reviews yet
        quantityOfActiveCodes: listing.quantityOfActiveCodes,
        quantityOfAllCodes: listing.quantityOfAllCodes,
        imgs: {
          // Use thumbnailUrl for both if no separate images are provided
          thumbnails: [listing.thumbnailUrl, listing.thumbnailUrl],
          previews: [listing.thumbnailUrl, listing.thumbnailUrl]
        }
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching product details:', error);
    return null;
  }
};

// Get all products with optional filters
export const getProducts = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  platform?: string;
  category?: string;
}): Promise<{ products: Product[]; total: number; page: number; totalPages: number } | null> => {
  try {
    const response = await api.get('/listings', { params });
    
    if (response.data && response.data.success) {
      const listings = response.data.data.listings;
      const products = listings.map(listing => ({
        id: listing.externalId,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        discountedPrice: listing.originalPrice ? listing.price : listing.price,
        originalPrice: listing.originalPrice,
        categoryId: listing.categoryId,
        categoryName: listing.categoryName,
        platform: listing.platform,
        region: listing.region,
        isRegionLocked: listing.isRegionLocked,
        supportedLanguages: listing.supportedLanguages,
        thumbnailUrl: listing.thumbnailUrl,
        autoDelivery: listing.autoDelivery,
        tags: listing.tags,
        status: listing.status,
        reviews: 0,
        quantityOfActiveCodes: listing.quantityOfActiveCodes,
        quantityOfAllCodes: listing.quantityOfAllCodes,
        imgs: {
          thumbnails: [listing.thumbnailUrl, listing.thumbnailUrl],
          previews: [listing.thumbnailUrl, listing.thumbnailUrl]
        }
      }));
      
      return {
        products,
        total: response.data.data.total,
        page: response.data.data.page,
        totalPages: response.data.data.totalPages
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
};
