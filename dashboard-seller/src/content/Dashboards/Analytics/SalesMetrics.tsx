import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { TrendingUp, Public, ShoppingBag } from '@mui/icons-material';
import { SalesData } from 'src/services/api/analytics';

interface SalesMetricsProps {
  data?: SalesData;
  loading: boolean;
}

function SalesMetrics({ data, loading }: SalesMetricsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Sales Metrics" />
        <CardContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} height={60} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const totalSalesByRegion = data?.salesByRegion?.reduce((sum, region) => sum + region.sales, 0) || 0;
  const totalRevenueByRegion = data?.salesByRegion?.reduce((sum, region) => sum + region.revenue, 0) || 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Sales Metrics"
        subheader="Regional performance and trends"
      />
      <CardContent>
        {/* Summary Stats */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <ShoppingBag color="primary" />
            <Typography variant="h6">
              {totalSalesByRegion.toLocaleString()} Total Sales
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            {formatCurrency(totalRevenueByRegion)} Total Revenue
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Sales by Region */}
        <Typography variant="subtitle1" gutterBottom>
          <Public sx={{ mr: 1, verticalAlign: 'middle' }} />
          Sales by Region
        </Typography>
        
        {data?.salesByRegion && data.salesByRegion.length > 0 ? (
          <List dense>
            {data.salesByRegion.slice(0, 5).map((region, index) => {
              const percentage = totalSalesByRegion > 0 
                ? ((region.sales / totalSalesByRegion) * 100).toFixed(1)
                : '0';
              
              return (
                <ListItem key={region._id} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {region._id}
                        </Typography>
                        <Chip 
                          label={`${percentage}%`} 
                          size="small" 
                          color={index === 0 ? 'primary' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box display="flex" justifyContent="space-between" mt={0.5}>
                        <Typography variant="caption" color="textSecondary">
                          {region.sales.toLocaleString()} sales
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatCurrency(region.revenue)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            py={4}
            color="text.secondary"
          >
            <Typography variant="body2">
              No regional sales data available
            </Typography>
          </Box>
        )}

        {/* Performance Indicator */}
        {data?.salesByRegion && data.salesByRegion.length > 0 && (
          <Box mt={2} p={2} bgcolor="background.default" borderRadius={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <TrendingUp color="success" fontSize="small" />
              <Typography variant="caption" color="success.main">
                Top Region: {data.salesByRegion[0]._id}
              </Typography>
            </Box>
            <Typography variant="caption" color="textSecondary" display="block">
              {((data.salesByRegion[0].sales / totalSalesByRegion) * 100).toFixed(1)}% of total sales
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default SalesMetrics;