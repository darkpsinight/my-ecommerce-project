import axios from 'axios';
import { API_BASE_URL } from 'src/config/api';

const API_URL = `${API_BASE_URL}/seller`;

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get token from Redux store
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

// Add request interceptor to include auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types for analytics data
export interface RevenueData {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  revenueByPlatform: Array<{
    platform: string;
    revenue: number;
    orders: number;
  }>;
  dailyTrend: Array<{
    date: {
      year: number;
      month: number;
      day: number;
    };
    revenue: number;
    orders: number;
  }>;
}

export interface SalesData {
  bestSellers: Array<{
    listingId: string;
    title: string;
    platform: string;
    totalSold: number;
    revenue: number;
  }>;
  salesByRegion: Array<{
    region: string;
    sales: number;
    revenue: number;
  }>;
}

export interface InventoryData {
  inventoryStats: Array<{
    status: string;
    count: number;
    totalCodes: number;
    activeCodes: number;
  }>;
  platformDistribution: Array<{
    platform: string;
    listings: number;
    totalCodes: number;
  }>;
}

export interface CustomerData {
  uniqueCustomerCount: number;
  topCustomers: Array<{
    customerId: string;
    orderCount: number;
    totalSpent: number;
    firstOrder: string;
    lastOrder: string;
  }>;
}

export interface EngagementData {
  totalViews: number;
  uniqueViewers: number;
  avgViewsPerListing: number;
  avgTimeOnPage: number; // in seconds
  totalTimeSpent: number; // in minutes
  viewsWithDuration: number;
  topViewedListings: Array<{
    listingId: string;
    title: string;
    platform: string;
    viewCount: number;
    uniqueViewers: number;
    avgTimeOnPage: number; // in seconds
    totalTimeSpent: number; // in minutes
  }>;
  viewsBySource: Array<{
    source: string;
    count: number;
  }>;
  dailyViews: Array<{
    date: {
      year: number;
      month: number;
      day: number;
    };
    views: number;
    uniqueViewers: number;
  }>;
  conversionRate: number;
}

export interface WishlistData {
  totalWishlistAdditions: number;
  uniqueWishlisters: number;
  wishlistConversionRate: number;
  mostWishlistedProducts: Array<{
    listingId: string;
    title: string;
    platform: string;
    wishlistCount: number;
  }>;
  wishlistAbandonmentRate: number;
  dailyWishlistActivity: Array<{
    date: {
      year: number;
      month: number;
      day: number;
    };
    additions: number;
    removals: number;
  }>;
}

export interface GeographicData {
  salesHeatmap: {
    regions: Array<{
      region: string;
      sales: number;
      revenue: number;
      orders: number;
      avgOrderValue: number;
      salesPercentage: number;
      revenuePercentage: number;
      coordinates: {
        lat: number;
        lng: number;
        name: string;
      };
    }>;
    totalSales: number;
    totalRevenue: number;
    totalRegions: number;
  };
  pricingOptimization: Array<{
    region: string;
    priceRange: string;
    sales: number;
    revenue: number;
    avgPrice: number;
    conversionRate: number;
  }>;
  marketPenetration: Array<{
    region: string;
    platforms: Array<{
      platform: string;
      sales: number;
      revenue: number;
      uniqueProducts: number;
      orders: number;
    }>;
    totalSales: number;
    totalRevenue: number;
    totalOrders: number;
    marketShare: number;
  }>;
  currencyAnalysis: {
    currency: string;
    regionalPerformance: Array<{
      region: string;
      period: {
        year: number;
        month: number;
      };
      sales: number;
      revenue: number;
      avgPrice: number;
      orders: number;
    }>;
    priceImpact: Array<{
      region: string;
      avgOrderValue: number;
      priceElasticity: number;
    }>;
  };
  regionalTrends: Array<{
    region: string;
    date: {
      year: number;
      month: number;
      day: number;
    };
    sales: number;
    revenue: number;
    orders: number;
  }>;
}

export interface CustomerGeographicData {
  customerSalesHeatmap: {
    countries: Array<{
      country: string;
      countryCode: string;
      region: string;
      city: string;
      sales: number;
      revenue: number;
      orders: number;
      avgOrderValue: number;
      salesPercentage: number;
      revenuePercentage: number;
      coordinates: {
        lat: number | null;
        lng: number | null;
      };
    }>;
    totalSales: number;
    totalRevenue: number;
    totalCountries: number;
  };
  customerViewsHeatmap: {
    countries: Array<{
      country: string;
      countryCode: string;
      region: string;
      city: string;
      views: number;
      uniqueViewers: number;
      viewsPercentage: number;
      coordinates: {
        lat: number | null;
        lng: number | null;
      };
    }>;
    totalViews: number;
    totalCountries: number;
  };
  regionalCustomerAnalysis: Array<{
    country: string;
    priceRange: string;
    sales: number;
    revenue: number;
    avgPrice: number;
    orders: number;
  }>;
  customerMarketPenetration: Array<{
    country: string;
    countryCode: string;
    customerCount: number;
    totalSales: number;
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    coordinates: {
      lat: number | null;
      lng: number | null;
    };
  }>;
}

export interface AnalyticsOverviewData {
  timeRange: string;
  revenue: RevenueData;
  sales: SalesData;
  inventory: InventoryData;
  customers: CustomerData;
  engagement: EngagementData;
  wishlist: WishlistData;
  geographic: GeographicData;
  customerGeographic: CustomerGeographicData;
  generatedAt: string;
}

export interface AnalyticsOverviewResponse {
  success: boolean;
  message: string;
  data: AnalyticsOverviewData;
}

export interface RevenueChartData {
  chartData: Array<{
    _id: {
      year: number;
      month: number;
      day?: number;
      week?: number;
    };
    revenue: number;
    orders: number;
  }>;
  period: string;
  timeRange: string;
}

export interface RevenueChartResponse {
  success: boolean;
  message: string;
  data: RevenueChartData;
}

export interface AnalyticsParams {
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export interface ChartParams extends AnalyticsParams {
  period?: 'daily' | 'weekly' | 'monthly';
}

class AnalyticsService {
  private baseUrl = '/analytics';

  async getOverview(params?: AnalyticsParams): Promise<AnalyticsOverviewResponse> {
    const response = await axiosInstance.get<AnalyticsOverviewResponse>(
      `${this.baseUrl}/overview`,
      { params }
    );
    return response.data;
  }

  async getRevenueChart(params?: ChartParams): Promise<RevenueChartResponse> {
    const response = await axiosInstance.get<RevenueChartResponse>(
      `${this.baseUrl}/revenue-chart`,
      { params }
    );
    return response.data;
  }
}

export const analyticsApi = new AnalyticsService();