import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Skeleton,
  useTheme,
  alpha,
  Grow,
  LinearProgress
} from '@mui/material';
import {
  AttachMoney,
  ShoppingCart,
  Inventory,
  People,
  AccessTime,
  Visibility,
  Campaign
} from '@mui/icons-material';

interface KPICardsProps {
  data?: any;
  loading: boolean;
  timeRange: string;
}

function KPICards({ data, loading, timeRange }: KPICardsProps) {
  const theme = useTheme();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  const kpiData = [
    {
      title: 'Total Revenue',
      value: data?.revenue?.totalRevenue || 0,
      format: 'currency',
      icon: <AttachMoney />,
      color: theme.palette.success.main,
      gradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`
    },
    {
      title: 'Total Orders',
      value: data?.revenue?.orderCount || 0,
      format: 'number',
      icon: <ShoppingCart />,
      color: theme.palette.info.main,
      gradient: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`
    },
    {
      title: 'Active Products',
      value: data?.inventory?.inventoryStats?.reduce((sum: number, stat: any) => sum + stat.count, 0) || 0,
      format: 'number',
      icon: <Inventory />,
      color: theme.palette.warning.main,
      gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`
    },
    {
      title: 'Unique Customers',
      value: data?.customers?.uniqueCustomerCount || 0,
      format: 'number',
      icon: <People />,
      color: theme.palette.primary.main,
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
    },
    {
      title: 'Avg Time on Page',
      value: data?.engagement?.avgTimeOnPage || 0,
      format: 'time',
      icon: <AccessTime />,
      color: theme.palette.secondary.main,
      gradient: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`
    },
    {
      title: 'Total Views',
      value: data?.engagement?.totalViews || 0,
      format: 'number',
      icon: <Visibility />,
      color: theme.palette.error.main,
      gradient: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`
    },
    {
      title: 'Customer Acquisition Cost',
      value: data?.cac?.overallCAC || 0,
      format: 'currency',
      icon: <Campaign />,
      color: '#9c27b0',
      gradient: `linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)`
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
          <Grid item xs={6} sm={4} md={3} lg={12/7} key={item}>
            <Card elevation={3}>
              <CardContent sx={{ p: { xs: 1.5, md: 2 }, pb: { xs: 2, md: 2.5 } }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton width="60%" height={16} />
                </Box>
                <Skeleton width="80%" height={28} sx={{ mb: 1 }} />
                <Skeleton width="100%" height={12} sx={{ mb: 0.5 }} />
                <Skeleton width="70%" height={12} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      {kpiData.map((kpi, index) => (
        <Grow in={true} timeout={300 + index * 100} key={index}>
          <Grid item xs={6} sm={4} md={3} lg={12/7}>
            <Card 
              elevation={3}
              sx={{ 
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease-in-out',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8],
                  '& .kpi-icon': {
                    transform: 'scale(1.05)'
                  }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: kpi.gradient
                }
              }}
            >
              <CardContent 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  p: { xs: 1.5, md: 2 },
                  pb: { xs: 2, md: 2.5 },
                  '&:last-child': { pb: { xs: 2, md: 2.5 } }
                }}
              >
                {/* Header with Icon */}
                <Box 
                  display="flex" 
                  alignItems="center" 
                  mb={{ xs: 1, md: 1.5 }}
                  sx={{
                    flexDirection: { xs: 'column', sm: 'row' },
                    textAlign: { xs: 'center', sm: 'left' }
                  }}
                >
                  <Box
                    className="kpi-icon"
                    sx={{
                      background: kpi.gradient,
                      color: 'white',
                      borderRadius: 2,
                      width: { xs: 32, md: 40 },
                      height: { xs: 32, md: 40 },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: { xs: 0, sm: 1.5 },
                      mb: { xs: 0.5, sm: 0 },
                      transition: 'transform 0.3s ease-in-out',
                      boxShadow: `0 2px 8px ${alpha(kpi.color, 0.3)}`
                    }}
                  >
                    {kpi.icon}
                  </Box>
                  <Box flex={1}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.65rem', md: '0.75rem' },
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        lineHeight: 1.2,
                        display: 'block'
                      }}
                    >
                      {kpi.title}
                    </Typography>
                  </Box>
                </Box>

                {/* Value - Much Larger and More Visible */}
                <Box display="flex" alignItems="center" justifyContent="center" sx={{ my: { xs: 1, md: 1.5 } }}>
                  <Typography 
                    variant="h4"
                    component="div" 
                    sx={{ 
                      fontWeight: 800,
                      color: theme.palette.text.primary,
                      fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                      textAlign: 'center',
                      lineHeight: 1.1,
                      textShadow: `0 1px 2px ${alpha(theme.palette.common.black, 0.1)}`
                    }}
                  >
                    {kpi.format === 'currency' 
                      ? formatCurrency(kpi.value)
                      : kpi.format === 'time'
                      ? formatTime(kpi.value)
                      : formatNumber(kpi.value)
                    }
                  </Typography>
                </Box>

                {/* Progress Bar and Time Range */}
                <Box sx={{ mt: 'auto' }}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (kpi.value / 1000) * 10)}
                    sx={{
                      height: { xs: 4, md: 6 },
                      borderRadius: 3,
                      backgroundColor: alpha(kpi.color, 0.1),
                      mb: { xs: 0.75, md: 1 },
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        background: kpi.gradient
                      }
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.65rem', md: '0.75rem' },
                      display: 'block',
                      textAlign: 'center',
                      fontWeight: 500,
                      lineHeight: 1.3
                    }}
                  >
                    {getTimeRangeLabel(timeRange)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grow>
      ))}
    </Grid>
  );
}

export default KPICards;