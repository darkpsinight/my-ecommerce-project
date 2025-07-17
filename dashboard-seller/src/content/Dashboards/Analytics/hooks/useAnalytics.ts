import { useState, useEffect } from 'react';
import { analyticsApi, AnalyticsOverviewResponse, RevenueChartResponse } from 'src/services/api/analytics';

export interface UseAnalyticsReturn {
  analyticsData: AnalyticsOverviewResponse['data'] | null;
  chartData: RevenueChartResponse['data'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useAnalytics = (timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): UseAnalyticsReturn => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverviewResponse['data'] | null>(null);
  const [chartData, setChartData] = useState<RevenueChartResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

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

    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchAnalytics();
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  return {
    analyticsData,
    chartData,
    loading,
    error,
    refetch
  };
};