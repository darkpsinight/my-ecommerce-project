import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Skeleton,
  Button,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Grow,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Inventory,
  People,
  Public,
  Favorite,
  ArrowForward,
  TrendingDown
} from '@mui/icons-material';

interface QuickInsightsProps {
  data?: any;
  chartData?: any;
  loading: boolean;
  timeRange: string;
}

function QuickInsights({ data, chartData, loading, timeRange }: QuickInsightsProps) {
  const theme = useTheme();
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getRevenueChange = (): number => {
    if (!chartData?.length || chartData.length < 2) return 0;
    const latest = chartData[chartData.length - 1]?.revenue || 0;
    const previous = chartData[chartData.length - 2]?.revenue || 0;
    if (previous === 0) return 0;
    return ((latest - previous) / previous * 100);
  };

  const getTopProduct = () => {
    const bestSellers = data?.sales?.bestSellers;
    if (!bestSellers || bestSellers.length === 0) return null;
    return bestSellers[0];
  };

  const truncateText = (text: string, maxLength: number = 20) => {
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
      gradient: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      content: loading ? null : (
        <Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h4" fontWeight={700} color="primary">
              {formatCurrency(data?.revenue?.totalRevenue || 0)}
            </Typography>
            <Chip 
              icon={getRevenueChange() >= 0 ? <TrendingUp /> : <TrendingDown />}
              label={`${getRevenueChange() >= 0 ? '+' : ''}${getRevenueChange().toFixed(1)}%`}
              size="small"
              color={getRevenueChange() >= 0 ? 'success' : 'error'}
              sx={{ fontWeight: 600 }}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(100, Math.abs(getRevenueChange()) * 5)} 
            sx={{ 
              mb: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha('#1976d2', 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
              }
            }}
          />
          <Typography variant="body2" color="textSecondary">
            Revenue trend vs previous period
          </Typography>
        </Box>
      ),
      link: '/dashboards/analytics/sales'
    },
    {
      title: 'Product Performance',
      icon: <Inventory />,
      color: '#ed6c02',
      gradient: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)',
      content: loading ? null : (
        <Box>
          <Typography variant="h6" fontWeight={600} color="warning.main" gutterBottom>
            {truncateText(getTopProduct()?.title || 'No sales data')}
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="textSecondary">
              Top seller
            </Typography>
            <Chip 
              label={getTopProduct() ? `${getTopProduct().totalSold} units` : 'N/A'}
              size="small"
              variant="outlined"
              color="warning"
            />
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="textSecondary">
              Active listings
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {data?.inventory?.inventoryStats?.reduce((sum: number, stat: any) => sum + stat.count, 0) || 0}
            </Typography>
          </Box>
        </Box>
      ),
      link: '/dashboards/analytics/products'
    },
    {
      title: 'Customer Intelligence',
      icon: <People />,
      color: '#2e7d32',
      gradient: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
      content: loading ? null : (
        <Box>
          <Typography variant="h4" fontWeight={700} color="success.main" gutterBottom>
            {formatNumber(data?.customers?.uniqueCustomerCount || 0)}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Unique customers this period
          </Typography>
          <Box 
            sx={{ 
              mt: 2,
              p: 1.5,
              backgroundColor: alpha('#2e7d32', 0.1),
              borderRadius: 1,
              border: `1px solid ${alpha('#2e7d32', 0.2)}`
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="textSecondary">
                Top customers
              </Typography>
              <Typography variant="caption" color="success.main" fontWeight={600}>
                {data?.customers?.topCustomers?.length || 0}
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
      link: '/dashboards/analytics/customers'
    },
    {
      title: 'Market Insights',
      icon: <Public />,
      color: '#7b1fa2',
      gradient: 'linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%)',
      content: loading ? null : (
        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ color: '#7b1fa2' }} gutterBottom>
            {getTopRegion()?.region || 'No regional data'}
          </Typography>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="textSecondary">
              Best region revenue
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {getTopRegion() ? formatCurrency(getTopRegion().revenue) : 'N/A'}
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="textSecondary">
              Active markets
            </Typography>
            <Chip 
              label={`${data?.sales?.salesByRegion?.length || 0} regions`}
              size="small"
              sx={{ 
                backgroundColor: alpha('#7b1fa2', 0.1),
                color: '#7b1fa2',
                fontWeight: 600
              }}
            />
          </Box>
        </Box>
      ),
      link: '/dashboards/analytics/market'
    },
    {
      title: 'Engagement & Growth',
      icon: <Favorite />,
      color: '#c62828',
      gradient: 'linear-gradient(135deg, #c62828 0%, #b71c1c 100%)',
      content: loading ? null : (
        <Box>
          <Typography variant="h4" fontWeight={700} color="error.main" gutterBottom>
            {formatNumber(data?.wishlist?.totalWishlistAdditions || data?.wishlist?.totalWishlists || 0)}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Total wishlist additions
          </Typography>
          <Box 
            sx={{ 
              mt: 2,
              p: 1.5,
              backgroundColor: alpha('#c62828', 0.1),
              borderRadius: 1,
              border: `1px solid ${alpha('#c62828', 0.2)}`
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="caption" color="textSecondary">
                Engagement rate
              </Typography>
              <Typography variant="caption" color="error.main" fontWeight={600}>
                {data?.engagement?.engagementRate || 0}%
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
      link: '/dashboards/analytics/engagement'
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {insights.map((_, index) => (
          <Grid item xs={12} sm={6} lg={4} key={index}>
            <Card>
              <CardContent sx={{ p: { xs: 2, md: 3 }, pb: { xs: 2.5, md: 3.5 } }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton width="60%" height={24} />
                  <Skeleton width={60} height={24} sx={{ ml: 'auto' }} />
                </Box>
                <Skeleton width="80%" height={32} sx={{ mb: 1 }} />
                <Skeleton width="100%" height={20} sx={{ mb: 1 }} />
                <Skeleton width="70%" height={20} sx={{ mb: 1 }} />
                <Skeleton width="90%" height={16} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      {insights.map((insight, index) => (
        <Grow in={true} timeout={400 + index * 100} key={index}>
          <Grid item xs={12} sm={6} lg={4}>
            <Card 
              elevation={3}
              sx={{ 
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.3s ease-in-out',
                background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${alpha(insight.color, 0.02)} 100%)`,
                border: `1px solid ${alpha(insight.color, 0.1)}`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[6],
                  '& .insight-icon': {
                    transform: 'scale(1.05)'
                  },
                  '& .view-button': {
                    transform: 'translateX(2px)'
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: insight.gradient
                }
              }} 
              onClick={() => navigate(insight.link)}
            >
              <CardContent 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  p: { xs: 2, md: 3 },
                  pb: { xs: 2.5, md: 3.5 },
                  '&:last-child': { pb: { xs: 2.5, md: 3.5 } }
                }}
              >
                {/* Header */}
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="space-between" 
                  mb={{ xs: 1.5, md: 2 }}
                  sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }
                  }}
                >
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    gap={1.5}
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      justifyContent: { xs: 'center', sm: 'flex-start' }
                    }}
                  >
                    <Box
                      className="insight-icon"
                      sx={{
                        background: insight.gradient,
                        color: 'white',
                        borderRadius: 2,
                        width: { xs: 32, md: 40 },
                        height: { xs: 32, md: 40 },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.3s ease-in-out',
                        boxShadow: `0 2px 8px ${alpha(insight.color, 0.3)}`
                      }}
                    >
                      {insight.icon}
                    </Box>
                    <Typography 
                      variant="h6" 
                      fontWeight={600}
                      sx={{
                        fontSize: { xs: '1rem', md: '1.25rem' },
                        textAlign: { xs: 'center', sm: 'left' }
                      }}
                    >
                      {insight.title}
                    </Typography>
                  </Box>
                  
                  <Button
                    className="view-button"
                    size="small"
                    endIcon={<ArrowForward />}
                    sx={{ 
                      transition: 'transform 0.3s ease-in-out',
                      color: insight.color,
                      fontSize: { xs: '0.75rem', md: '0.875rem' },
                      minWidth: { xs: 'auto', sm: 'auto' },
                      '&:hover': {
                        backgroundColor: alpha(insight.color, 0.1)
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(insight.link);
                    }}
                  >
                    View
                  </Button>
                </Box>
                
                {/* Content */}
                <Box 
                  sx={{
                    '& .MuiTypography-h4': {
                      fontSize: { xs: '1.5rem', md: '2rem' },
                      lineHeight: 1.2,
                      mb: { xs: 1, md: 1.5 }
                    },
                    '& .MuiTypography-h6': {
                      fontSize: { xs: '1rem', md: '1.25rem' },
                      lineHeight: 1.3,
                      mb: { xs: 1, md: 1.5 }
                    },
                    '& .MuiTypography-body2': {
                      fontSize: { xs: '0.8rem', md: '0.875rem' },
                      lineHeight: 1.4,
                      mb: { xs: 0.5, md: 1 }
                    },
                    '& .MuiTypography-caption': {
                      fontSize: { xs: '0.75rem', md: '0.8rem' },
                      lineHeight: 1.3
                    },
                    '& .MuiLinearProgress-root': {
                      mb: { xs: 1, md: 1.5 }
                    },
                    '& .MuiDivider-root': {
                      my: { xs: 1, md: 1.5 }
                    }
                  }}
                >
                  {insight.content}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grow>
      ))}
    </Grid>
  );
}

export default QuickInsights;