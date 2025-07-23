import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Skeleton,
  Button,
  Chip,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Inventory,
  People,
  Public,
  Favorite,
  ArrowForward
} from '@mui/icons-material';

interface QuickInsightsProps {
  data?: any;
  chartData?: any;
  loading: boolean;
  timeRange: string;
}

function QuickInsights({ data, chartData, loading, timeRange }: QuickInsightsProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getRevenueChange = (): string => {
    if (!chartData?.length || chartData.length < 2) return '0';
    const latest = chartData[chartData.length - 1]?.revenue || 0;
    const previous = chartData[chartData.length - 2]?.revenue || 0;
    if (previous === 0) return '0';
    return ((latest - previous) / previous * 100).toFixed(1);
  };

  const getTopProduct = () => {
    const bestSellers = data?.sales?.bestSellers;
    if (!bestSellers || bestSellers.length === 0) return null;
    return bestSellers[0];
  };

  const truncateText = (text: string, maxLength: number = 25) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const getTopRegion = () => {
    const salesByRegion = data?.sales?.salesByRegion;
    if (!salesByRegion || salesByRegion.length === 0) return null;
    return salesByRegion.reduce((top: any, region: any) => 
      region.revenue > (top?.revenue || 0) ? region : top
    );
  };

  const insights = [
    {
      title: 'Sales Performance',
      icon: <TrendingUp />,
      color: '#1976d2',
      content: loading ? null : (
        <Box>
          <Typography variant="h6" gutterBottom>
            {formatCurrency(data?.revenue?.totalRevenue || 0)}
          </Typography>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="body2" color="textSecondary">
              Revenue trend: 
            </Typography>
            <Chip 
              label={`${getRevenueChange()}%`}
              size="small"
              color={parseFloat(getRevenueChange()) >= 0 ? 'success' : 'error'}
              sx={{ ml: 1 }}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(100, Math.abs(parseFloat(getRevenueChange())) * 10)} 
            sx={{ mb: 1 }}
          />
        </Box>
      ),
      link: '/dashboards/analytics/sales'
    },
    {
      title: 'Product Analytics',
      icon: <Inventory />,
      color: '#ed6c02',
      content: loading ? null : (
        <Box>
          <Typography variant="h6" gutterBottom>
            {truncateText(getTopProduct()?.title || 'No sales data')}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Top seller: {getTopProduct() ? `${getTopProduct().totalSold} units` : 'N/A'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Active listings: {data?.inventory?.inventoryStats?.reduce((sum: number, stat: any) => sum + stat.count, 0) || 0}
          </Typography>
        </Box>
      ),
      link: '/dashboards/analytics/products'
    },
    {
      title: 'Customer Intelligence',
      icon: <People />,
      color: '#2e7d32',
      content: loading ? null : (
        <Box>
          <Typography variant="h6" gutterBottom>
            {formatNumber(data?.customers?.uniqueCustomerCount || 0)}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Unique customers this period
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Top customers: {data?.customers?.topCustomers?.length || 0}
          </Typography>
        </Box>
      ),
      link: '/dashboards/analytics/customers'
    },
    {
      title: 'Market Insights',
      icon: <Public />,
      color: '#7b1fa2',
      content: loading ? null : (
        <Box>
          <Typography variant="h6" gutterBottom>
            {getTopRegion()?.region || 'No regional data'}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Best region: {getTopRegion() ? formatCurrency(getTopRegion().revenue) : 'N/A'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Markets: {data?.sales?.salesByRegion?.length || 0} regions
          </Typography>
        </Box>
      ),
      link: '/dashboards/analytics/market'
    },
    {
      title: 'Engagement & Growth',
      icon: <Favorite />,
      color: '#c62828',
      content: loading ? null : (
        <Box>
          <Typography variant="h6" gutterBottom>
            {formatNumber(data?.wishlist?.totalWishlistAdditions || data?.wishlist?.totalWishlists || 0)}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Total wishlist additions
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Engagement rate: {data?.engagement?.engagementRate || 0}%
          </Typography>
        </Box>
      ),
      link: '/dashboards/analytics/engagement'
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={3}>
        {insights.map((_, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card sx={{ height: 200 }}>
              <CardContent>
                <Skeleton height={160} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {insights.map((insight, index) => (
        <Grid item xs={12} md={6} lg={4} key={index}>
          <Card sx={{ height: 200, cursor: 'pointer' }} onClick={() => navigate(insight.link)}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" mb={2}>
                <Box
                  sx={{
                    backgroundColor: insight.color,
                    color: 'white',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 1
                  }}
                >
                  {insight.icon}
                </Box>
                <Typography variant="h6" component="div">
                  {insight.title}
                </Typography>
              </Box>
              
              <Box flex={1}>
                {insight.content}
              </Box>

              <Button
                size="small"
                endIcon={<ArrowForward />}
                sx={{ alignSelf: 'flex-start', mt: 1 }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(insight.link);
                }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default QuickInsights;