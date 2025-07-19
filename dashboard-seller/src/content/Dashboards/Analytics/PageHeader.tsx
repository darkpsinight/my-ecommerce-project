import { Typography, Button, Grid, Chip, CircularProgress } from '@mui/material';
import { TrendingUp, Assessment, Star, FileDownload } from '@mui/icons-material';
import { exportAnalyticsToCSV } from '../../../utils/analyticsExport';
import { AnalyticsOverviewData, RevenueChartData } from '../../../services/api/analytics';

interface PageHeaderProps {
  analyticsData?: AnalyticsOverviewData | null;
  chartData?: RevenueChartData | null;
  timeRange?: string;
  loading?: boolean;
}

function PageHeader({ analyticsData, chartData, timeRange = '30d', loading = false }: PageHeaderProps) {
  const handleExportReport = () => {
    if (!analyticsData) {
      console.warn('No analytics data available for export');
      return;
    }

    try {
      exportAnalyticsToCSV(analyticsData, chartData, timeRange);
    } catch (error) {
      console.error('Error exporting analytics report:', error);
    }
  };

  return (
    <Grid container justifyContent="space-between" alignItems="center">
      <Grid item xs={12} sm={6}>
        <Typography variant="h3" component="h3" gutterBottom>
          <Assessment sx={{ fontSize: 32, color: 'primary.main', mr: 1, verticalAlign: 'middle' }} />
          VIP Analytics Dashboard
          <Chip 
            icon={<Star />} 
            label="VIP Feature" 
            color="primary" 
            variant="outlined"
            size="small"
            sx={{ ml: 2, verticalAlign: 'middle' }}
          />
        </Typography>
        <Typography variant="subtitle2">
          Comprehensive insights and performance metrics for VIP sellers
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' }, mt: { xs: 2, sm: 0 } }}>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <FileDownload />}
          size="medium"
          onClick={handleExportReport}
          disabled={loading || !analyticsData}
        >
          {loading ? 'Loading...' : 'Export Report'}
        </Button>
      </Grid>
    </Grid>
  );
}

export default PageHeader;