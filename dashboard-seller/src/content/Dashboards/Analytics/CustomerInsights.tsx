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
                {data?.repeatPurchaseRate || 0}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Repeat Purchase Rate
              </Typography>
            </Box>
          </Box>

          {/* Customer Metrics Grid */}
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={2}>
            <Box textAlign="center" p={1.5} bgcolor="background.default" borderRadius={1}>
              <Typography variant="h6" color="success.main">
                {formatCurrency(data?.avgCustomerLifetimeValue || 0)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Avg Customer LTV
              </Typography>
            </Box>
            <Box textAlign="center" p={1.5} bgcolor="background.default" borderRadius={1}>
              <Typography variant="h6" color="warning.main">
                {data?.churnRate || 0}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Churn Rate (90d)
              </Typography>
            </Box>
          </Box>

          {/* Additional Metrics */}
          <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={1} mb={2}>
            <Box textAlign="center" p={1} bgcolor="background.default" borderRadius={1}>
              <Typography variant="body2" color="primary">
                {formatCurrency(data?.avgOrderValue || 0)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Avg Order Value
              </Typography>
            </Box>
            <Box textAlign="center" p={1} bgcolor="background.default" borderRadius={1}>
              <Typography variant="body2" color="secondary">
                {data?.avgTimeBetweenPurchases || 0}d
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Avg Days Between Orders
              </Typography>
            </Box>
            <Box textAlign="center" p={1} bgcolor="background.default" borderRadius={1}>
              <Typography variant="body2" color="info.main">
                {data?.avgOrderFrequency?.toFixed(1) || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Orders per Customer
              </Typography>
            </Box>
          </Box>

          {/* Customer Segmentation */}
          {data?.customerSegmentation && (
            <Box p={2} bgcolor="background.default" borderRadius={1}>
              <Typography variant="subtitle2" gutterBottom>
                Customer Segments
              </Typography>
              <Box display="flex" justifyContent="space-between" gap={1}>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h6" color="info.main">
                    {data.customerSegmentation.newCustomers}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    New (1 order)
                  </Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h6" color="warning.main">
                    {data.customerSegmentation.repeatCustomers}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Repeat (2-5 orders)
                  </Typography>
                </Box>
                <Box textAlign="center" flex={1}>
                  <Typography variant="h6" color="success.main">
                    {data.customerSegmentation.loyalCustomers}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Loyal (6+ orders)
                  </Typography>
                </Box>
              </Box>
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
              • {data.topCustomers.filter(c => c.orderCount > 1).length} repeat customers ({((data.topCustomers.filter(c => c.orderCount > 1).length / data.topCustomers.length) * 100).toFixed(1)}%)
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              • {data.topCustomers.filter(c => getCustomerTier(c.totalSpent).tier !== 'Bronze').length} premium customers (Silver+)
            </Typography>
            {data.avgTimeBetweenPurchases > 0 && (
              <Typography variant="caption" color="textSecondary" display="block">
                • Customers typically reorder every {Math.round(data.avgTimeBetweenPurchases)} days
              </Typography>
            )}
            {data.churnRate > 0 && (
              <Typography variant="caption" color="textSecondary" display="block">
                • {data.churnRate}% of customers haven't purchased in 90+ days
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default CustomerInsights;