import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Skeleton,
  useTheme,
  Grid,
  Alert
} from '@mui/material';
import {
  LocationOn,
  ShoppingCart,
  AttachMoney,
  TrendingUp,
  Public
} from '@mui/icons-material';

interface CustomerSalesHeatmapData {
  countries: Array<{
    country: string;
    countryCode: string;
    region: string;
    city: string;
    sales: number;
    revenue: number;
    orders: number;
    avgOrderValue: number;
    salesPercentage: number;
    revenuePercentage: number;
    coordinates: {
      lat: number | null;
      lng: number | null;
    };
  }>;
  totalSales: number;
  totalRevenue: number;
  totalCountries: number;
}

interface CustomerSalesHeatmapProps {
  data: CustomerSalesHeatmapData;
  loading: boolean;
}

function CustomerSalesHeatmap({ data, loading }: CustomerSalesHeatmapProps) {
  const theme = useTheme();

  const getCountryFlag = (countryCode: string) => {
    // Convert country code to flag emoji
    if (countryCode === 'XX' || !countryCode) return '🌍';
    
    const flagMap: { [key: string]: string } = {
      'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷',
      'IT': '🇮🇹', 'ES': '🇪🇸', 'NL': '🇳🇱', 'AU': '🇦🇺', 'JP': '🇯🇵',
      'KR': '🇰🇷', 'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷', 'MX': '🇲🇽',
      'RU': '🇷🇺', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮',
      'PL': '🇵🇱', 'CZ': '🇨🇿', 'AT': '🇦🇹', 'CH': '🇨🇭', 'BE': '🇧🇪'
    };
    
    return flagMap[countryCode.toUpperCase()] || '🌍';
  };

  const getIntensityColor = (percentage: number) => {
    if (percentage >= 25) return theme.palette.error.main;
    if (percentage >= 15) return theme.palette.warning.main;
    if (percentage >= 10) return theme.palette.info.main;
    if (percentage >= 5) return theme.palette.success.main;
    return theme.palette.grey[400];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title={<Skeleton width="60%" />} />
        <CardContent>
          <Skeleton height={400} />
        </CardContent>
      </Card>
    );
  }

  if (!data.countries.length) {
    return (
      <Card>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <LocationOn color="primary" />
              <Typography variant="h6">Customer Sales Heatmap</Typography>
            </Box>
          }
          subheader="No customer sales data available yet"
        />
        <CardContent>
          <Alert severity="info">
            <Typography variant="body2">
              Customer sales locations will appear here once customers start making purchases. 
              Location data is automatically collected from customer IP addresses during checkout.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const sortedCountries = [...data.countries].sort((a, b) => b.sales - a.sales);

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <LocationOn color="primary" />
            <Typography variant="h6">Customer Sales Heatmap</Typography>
            <Chip 
              label={`${data.totalCountries} countries`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
        }
        subheader="Where your customers are buying from (based on IP geolocation)"
      />
      <CardContent>
        {/* World Map Visualization */}
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom>
            🌍 Global Customer Distribution
          </Typography>
          <Grid container spacing={2}>
            {sortedCountries.slice(0, 12).map((country, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={country.country}>
                <Box
                  sx={{
                    p: 2,
                    border: 2,
                    borderColor: getIntensityColor(country.salesPercentage),
                    borderRadius: 2,
                    bgcolor: getIntensityColor(country.salesPercentage) + '15',
                    position: 'relative',
                    height: '140px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Country Header */}
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="h4">
                      {getCountryFlag(country.countryCode)}
                    </Typography>
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight="bold" noWrap>
                        {country.country}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rank #{index + 1}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Sales Progress */}
                  <Box mb={1} flex={1}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Sales
                      </Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {country.sales.toLocaleString()}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={country.salesPercentage}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getIntensityColor(country.salesPercentage)
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {country.salesPercentage}% of total
                    </Typography>
                  </Box>

                  {/* Revenue & Orders */}
                  <Box display="flex" justifyContent="space-between">
                    <Box textAlign="center">
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        ${country.revenue.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Revenue
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="body2" fontWeight="bold" color="info.main">
                        {country.orders}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Orders
                      </Typography>
                    </Box>
                  </Box>

                  {/* Intensity Badge */}
                  <Box position="absolute" top={8} right={8}>
                    <Chip
                      label={`${country.salesPercentage}%`}
                      size="small"
                      sx={{
                        bgcolor: getIntensityColor(country.salesPercentage),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Detailed Country List */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            📊 Detailed Customer Sales by Country
          </Typography>
          <List>
            {sortedCountries.map((country, index) => (
              <ListItem key={country.country} divider>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h5">
                          {getCountryFlag(country.countryCode)}
                        </Typography>
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {country.country}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {country.region} • {country.city}
                          </Typography>
                        </Box>
                        {index === 0 && (
                          <Chip label="Top Market" size="small" color="primary" />
                        )}
                      </Box>
                      <Box display="flex" gap={1}>
                        <Chip
                          icon={<ShoppingCart />}
                          label={`${country.sales.toLocaleString()} sales`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          icon={<AttachMoney />}
                          label={`$${country.revenue.toLocaleString()}`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box mt={1}>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="caption" color="text.secondary">
                          Market Share: {country.salesPercentage}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Revenue Share: {country.revenuePercentage}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg Order: ${country.avgOrderValue}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {country.orders} orders
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={country.salesPercentage}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getIntensityColor(country.salesPercentage)
                          }
                        }}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Global Insights */}
        <Box mt={3} p={2} bgcolor="background.default" borderRadius={2}>
          <Typography variant="subtitle2" gutterBottom color="primary">
            🌍 Global Customer Insights
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • <strong>{sortedCountries[0]?.country}</strong> is your top customer market with {sortedCountries[0]?.salesPercentage}% of sales
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • You have customers in <strong>{data.totalCountries} countries</strong> with total sales of <strong>{data.totalSales.toLocaleString()} units</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Global customer revenue: <strong>${data.totalRevenue.toLocaleString()}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Top 3 markets: {sortedCountries.slice(0, 3).map(c => `${getCountryFlag(c.countryCode)} ${c.country}`).join(', ')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default CustomerSalesHeatmap;