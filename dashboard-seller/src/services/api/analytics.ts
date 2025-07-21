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
  topViewedListings: Array<{
    listingId: string;
    title: string;
    platform: string;
    viewCount: number;
    uniqueViewers: number;
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

export interface AnalyticsOverviewData {
  timeRange: string;
  revenue: RevenueData;
  sales: SalesData;
  inventory: InventoryData;
  customers: CustomerData;
  engagement: EngagementData;
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