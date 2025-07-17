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

// Function to get token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
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
    _id: string;
    revenue: number;
    orders: number;
  }>;
  dailyTrend: Array<{
    _id: {
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
    _id: string;
    title: string;
    platform: string;
    totalSold: number;
    revenue: number;
  }>;
  salesByRegion: Array<{
    _id: string;
    sales: number;
    revenue: number;
  }>;
}

export interface InventoryData {
  inventoryStats: Array<{
    _id: string;
    count: number;
    totalCodes: number;
    activeCodes: number;
  }>;
  platformDistribution: Array<{
    _id: string;
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

export interface AnalyticsOverviewData {
  timeRange: string;
  revenue: RevenueData;
  sales: SalesData;
  inventory: InventoryData;
  customers: CustomerData;
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