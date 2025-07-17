import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Box,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  AttachMoney,
  ShoppingCart,
  TrendingUp,
  Assessment
} from '@mui/icons-material';

interface RevenueData {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  revenueByPlatform: Array<{
    _id: string;
    revenue: number;
    orders: number;
  }>;
}

interface RevenueOverviewProps {
  data?: RevenueData;
  loading: boolean;
  timeRange: string;
}

function RevenueOverview({ data, loading, timeRange }: RevenueOverviewProps) {
  const theme = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
      default: return 'Selected Period';
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon, 
    color = 'primary',
    loading: cardLoading 
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'warning';
    loading: boolean;
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            {cardLoading ? (
              <Skeleton width={100} height={32} />
            ) : (
              <Typography variant="h4" component="div">
                {value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: theme.palette[color].light,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader
        title={`Revenue Overview - ${getTimeRangeLabel(timeRange)}`}
        subheader="Key financial metrics for your business"
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Revenue"
              value={loading ? 0 : formatCurrency(data?.totalRevenue || 0)}
              icon={<AttachMoney color="primary" />}
              color="primary"
              loading={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Orders"
              value={loading ? 0 : (data?.orderCount || 0).toLocaleString()}
              icon={<ShoppingCart color="secondary" />}
              color="secondary"
              loading={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Avg Order Value"
              value={loading ? 0 : formatCurrency(data?.avgOrderValue || 0)}
              icon={<TrendingUp color="success" />}
              color="success"
              loading={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Top Platform"
              value={loading ? '-' : (data?.revenueByPlatform?.[0]?._id || 'N/A')}
              icon={<Assessment color="warning" />}
              color="warning"
              loading={loading}
            />
          </Grid>
        </Grid>

        {/* Platform Revenue Breakdown */}
        {!loading && data?.revenueByPlatform && data.revenueByPlatform.length > 0 && (
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Revenue by Platform
            </Typography>
            <Grid container spacing={2}>
              {data.revenueByPlatform.slice(0, 4).map((platform, index) => (
                <Grid item xs={12} sm={6} md={3} key={platform._id}>
                  <Box
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="subtitle2" color="textSecondary">
                      {platform._id}
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(platform.revenue)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {platform.orders} orders
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default RevenueOverview;