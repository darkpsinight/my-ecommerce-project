import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider
} from '@mui/material';
import {
  People,
  Person,
  Star,
  TrendingUp
} from '@mui/icons-material';
import { CustomerData } from 'src/services/api/analytics';

interface CustomerInsightsProps {
  data?: CustomerData;
  loading: boolean;
}

function CustomerInsights({ data, loading }: CustomerInsightsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCustomerTier = (totalSpent: number) => {
    if (totalSpent >= 500) return { tier: 'VIP', color: 'error' as const };
    if (totalSpent >= 200) return { tier: 'Gold', color: 'warning' as const };
    if (totalSpent >= 100) return { tier: 'Silver', color: 'info' as const };
    return { tier: 'Bronze', color: 'default' as const };
  };

  const getAvatarColor = (index: number) => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'error', 'info'];
    return colors[index % colors.length] as 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Customer Insights" />
        <CardContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} height={70} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data?.topCustomers?.reduce((sum, customer) => sum + customer.totalSpent, 0) || 0;
  const avgOrdersPerCustomer = data?.topCustomers?.length > 0 
    ? (data.topCustomers.reduce((sum, customer) => sum + customer.orderCount, 0) / data.topCustomers.length)
    : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Customer Insights"
        subheader="Your most valuable customers"
        avatar={<People color="primary" />}
      />
      <CardContent>
        {/* Summary Stats */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Box textAlign="center" flex={1}>
              <Typography variant="h5" color="primary">
                {data?.uniqueCustomerCount || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Unique Customers
              </Typography>
            </Box>
            <Box textAlign="center" flex={1}>
              <Typography variant="h5" color="secondary">
                {avgOrdersPerCustomer.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Avg Orders/Customer
              </Typography>
            </Box>
          </Box>
          
          {totalRevenue > 0 && (
            <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={1}>
              <Typography variant="h6" color="success.main">
                {formatCurrency(totalRevenue)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Revenue from Top Customers
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Top Customers List */}
        <Typography variant="subtitle1" gutterBottom>
          <Star sx={{ mr: 1, verticalAlign: 'middle' }} />
          Top Customers
        </Typography>

        {data?.topCustomers && data.topCustomers.length > 0 ? (
          <List>
            {data.topCustomers.slice(0, 6).map((customer, index) => {
              const { tier, color } = getCustomerTier(customer.totalSpent);
              const daysSinceLastOrder = Math.floor(
                (new Date().getTime() - new Date(customer.lastOrder).getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <ListItem key={customer.customerId} sx={{ px: 0, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: `${getAvatarColor(index)}.main`,
                        width: 40,
                        height: 40
                      }}
                    >
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}>
                          Customer #{index + 1}
                        </Typography>
                        <Chip 
                          label={tier}
                          size="small"
                          color={color}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="caption" color="textSecondary">
                            {customer.orderCount} orders
                          </Typography>
                          <Typography variant="caption" color="success.main" fontWeight="bold">
                            {formatCurrency(customer.totalSpent)}
                          </Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption" color="textSecondary">
                            First: {formatDate(customer.firstOrder)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {daysSinceLastOrder === 0 ? 'Today' : `${daysSinceLastOrder}d ago`}
                          </Typography>
                        </Box>
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
            py={6}
            color="text.secondary"
          >
            <Box textAlign="center">
              <People sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body2">
                No customer data available
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Complete some sales to see customer insights
              </Typography>
            </Box>
          </Box>
        )}

        {/* Customer Insights */}
        {data?.topCustomers && data.topCustomers.length > 0 && (
          <Box mt={2} p={2} bgcolor="background.default" borderRadius={1}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <TrendingUp color="success" fontSize="small" />
              <Typography variant="caption" color="success.main">
                Customer Loyalty Insights
              </Typography>
            </Box>
            <Typography variant="caption" color="textSecondary" display="block">
              • {data.topCustomers.filter(c => c.orderCount > 1).length} repeat customers
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              • {data.topCustomers.filter(c => getCustomerTier(c.totalSpent).tier !== 'Bronze').length} premium customers
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default CustomerInsights;