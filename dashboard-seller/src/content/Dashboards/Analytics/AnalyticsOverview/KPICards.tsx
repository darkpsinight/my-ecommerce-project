import {
  Card,
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
  Inventory,
  People
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
    return new Intl.NumberFormat('en-US').format(num);
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
      color: theme.palette.success.main
    },
    {
      title: 'Total Orders',
      value: data?.revenue?.orderCount || 0,
      format: 'number',
      icon: <ShoppingCart />,
      color: theme.palette.info.main
    },
    {
      title: 'Active Products',
      value: data?.inventory?.inventoryStats?.reduce((sum: number, stat: any) => sum + stat.count, 0) || 0,
      format: 'number',
      icon: <Inventory />,
      color: theme.palette.warning.main
    },
    {
      title: 'Unique Customers',
      value: data?.customers?.uniqueCustomerCount || 0,
      format: 'number',
      icon: <People />,
      color: theme.palette.primary.main
    }
  ];

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <Card>
              <CardContent>
                <Skeleton height={80} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {kpiData.map((kpi, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <Box
                  sx={{
                    backgroundColor: kpi.color,
                    color: 'white',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}
                >
                  {kpi.icon}
                </Box>
                <Typography variant="h6" color="textSecondary">
                  {kpi.title}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" gutterBottom>
                {kpi.format === 'currency' 
                  ? formatCurrency(kpi.value)
                  : formatNumber(kpi.value)
                }
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {getTimeRangeLabel(timeRange)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

export default KPICards;