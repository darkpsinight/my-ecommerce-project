import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { analyticsApi, AnalyticsOverviewResponse, RevenueChartResponse } from 'src/services/api/analytics';

interface AnalyticsContextData {
  analyticsData: AnalyticsOverviewResponse['data'] | null;
  chartData: RevenueChartResponse['data'] | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  timeRange: '7d' | '30d' | '90d' | '1y';
  setTimeRange: (range: '7d' | '30d' | '90d' | '1y') => void;
  refetch: () => Promise<void>;
  isRefreshing: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextData | undefined>(undefined);

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

const CACHE_DURATION = 60 * 1000; // 60 seconds cache
const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000; // Auto-refresh every 2 minutes

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverviewResponse['data'] | null>(null);
  const [chartData, setChartData] = useState<RevenueChartResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchParamsRef = useRef<string>('');

  const fetchAnalytics = useCallback(async (forceRefresh = false) => {
    const currentParams = `${timeRange}`;
    const now = new Date();
    
    // Check if we should use cached data
    if (!forceRefresh && 
        lastUpdated && 
        (now.getTime() - lastUpdated.getTime()) < CACHE_DURATION &&
        lastFetchParamsRef.current === currentParams) {
      console.log('Using cached analytics data');
      return;
    }

    try {
      // Set loading state only for initial load, use isRefreshing for manual refreshes
      if (!analyticsData) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      setError(null);

      console.log(`Fetching analytics data for timeRange: ${timeRange}`);

      // Fetch both overview and chart data in parallel
      const [overviewResponse, chartResponse] = await Promise.all([
        analyticsApi.getOverview({ timeRange }),
        analyticsApi.getRevenueChart({ timeRange, period: 'daily' })
      ]);

      if (overviewResponse.success) {
        setAnalyticsData(overviewResponse.data);
      } else {
        throw new Error(overviewResponse.message || 'Failed to fetch analytics overview');
      }

      if (chartResponse.success) {
        setChartData(chartResponse.data);
      } else {
        throw new Error(chartResponse.message || 'Failed to fetch chart data');
      }

      setLastUpdated(new Date());
      lastFetchParamsRef.current = currentParams;
      console.log('Analytics data fetched successfully');

    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange, lastUpdated, analyticsData]);

  const refetch = useCallback(async () => {
    console.log('Manual refresh triggered');
    await fetchAnalytics(true);
  }, [fetchAnalytics]);

  const handleTimeRangeChange = useCallback((newTimeRange: '7d' | '30d' | '90d' | '1y') => {
    console.log(`Time range changed to: ${newTimeRange}`);
    setTimeRange(newTimeRange);
  }, []);

  // Initial fetch and fetch when timeRange changes
  useEffect(() => {
    fetchAnalytics(true); // Force refresh when timeRange changes
  }, [timeRange]);

  // Set up auto-refresh timer
  useEffect(() => {
    // Clear existing timer
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
    }

    // Set up new timer
    autoRefreshTimerRef.current = setInterval(() => {
      console.log('Auto-refresh triggered');
      fetchAnalytics(true);
    }, AUTO_REFRESH_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [fetchAnalytics]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, []);

  const contextValue: AnalyticsContextData = {
    analyticsData,
    chartData,
    loading,
    error,
    lastUpdated,
    timeRange,
    setTimeRange: handleTimeRangeChange,
    refetch,
    isRefreshing
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Wrapper component for router usage
export const AnalyticsProviderWrapper: React.FC = () => {
  return (
    <AnalyticsProvider>
      <Outlet />
    </AnalyticsProvider>
  );
};

export const useAnalyticsContext = (): AnalyticsContextData => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};