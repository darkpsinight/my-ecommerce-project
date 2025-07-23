import { useAnalyticsContext } from '../context/AnalyticsContext';

export interface UseOptimizedAnalyticsReturn {
  analyticsData: any;
  chartData: any;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  timeRange: '7d' | '30d' | '90d' | '1y';
  setTimeRange: (range: '7d' | '30d' | '90d' | '1y') => void;
}

export const useOptimizedAnalytics = (): UseOptimizedAnalyticsReturn => {
  const context = useAnalyticsContext();
  
  return {
    analyticsData: context.analyticsData,
    chartData: context.chartData,
    loading: context.loading,
    error: context.error,
    refetch: context.refetch,
    lastUpdated: context.lastUpdated,
    isRefreshing: context.isRefreshing,
    timeRange: context.timeRange,
    setTimeRange: context.setTimeRange
  };
};