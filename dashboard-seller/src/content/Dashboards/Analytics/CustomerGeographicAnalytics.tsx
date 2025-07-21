import React from 'react';
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
  LocationOn,
  Visibility,
  ShoppingCart,
  People,
  Public
} from '@mui/icons-material';
import { CustomerGeographicData } from 'src/services/api/analytics';
import CustomerSalesHeatmap from './CustomerGeographicComponents/CustomerSalesHeatmap';
import CustomerViewsHeatmap from './CustomerGeographicComponents/CustomerViewsHeatmap';
import CustomerRegionalAnalysis from './CustomerGeographicComponents/CustomerRegionalAnalysis';
import CustomerMarketPenetration from './CustomerGeographicComponents/CustomerMarketPenetration';

interface CustomerGeographicAnalyticsProps {
  data?: CustomerGeographicData;
  loading: boolean;
}

function CustomerGeographicAnalytics({ data, loading }: CustomerGeographicAnalyticsProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Card>
        <CardHeader
          title={<Skeleton width="60%" />}
          subheader={<Skeleton width="40%" />}
        />
        <CardContent>
          <Grid container spacing={3}>
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} md={6} key={item}>
                <Skeleton height={300} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader
          title="Customer Geographic Analytics"
          subheader="No customer location data available yet"
        />
        <CardContent>
          <Box textAlign="center" py={4}>
            <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Start Getting Customer Location Data
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Customer locations will appear here as they make purchases and view your products.
              This data is collected automatically from IP addresses.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <LocationOn color="primary" />
            <Typography variant="h6">Customer Geographic Analytics</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              Real customer locations
            </Typography>
          </Box>
        }
        subheader="Analytics based on actual customer locations from IP geolocation"
      />
      <CardContent>
        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box
              p={2}
              bgcolor={theme.palette.primary.light + '20'}
              borderRadius={2}
              textAlign="center"
            >
              <Public 
                sx={{ 
                  fontSize: 32, 
                  color: theme.palette.primary.main,
                  mb: 1 
                }} 
              />
              <Typography variant="h4" fontWeight="bold">
                {data.customerSalesHeatmap.totalCountries}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Countries (Sales)
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box
              p={2}
              bgcolor={theme.palette.success.light + '20'}
              borderRadius={2}
              textAlign="center"
            >
              <ShoppingCart 
                sx={{ 
                  fontSize: 32, 
                  color: theme.palette.success.main,
                  mb: 1 
                }} 
              />
              <Typography variant="h4" fontWeight="bold">
                {data.customerSalesHeatmap.totalSales.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer Sales
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box
              p={2}
              bgcolor={theme.palette.info.light + '20'}
              borderRadius={2}
              textAlign="center"
            >
              <Visibility 
                sx={{ 
                  fontSize: 32, 
                  color: theme.palette.info.main,
                  mb: 1 
                }} 
              />
              <Typography variant="h4" fontWeight="bold">
                {data.customerViewsHeatmap.totalViews.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer Views
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box
              p={2}
              bgcolor={theme.palette.warning.light + '20'}
              borderRadius={2}
              textAlign="center"
            >
              <People 
                sx={{ 
                  fontSize: 32, 
                  color: theme.palette.warning.main,
                  mb: 1 
                }} 
              />
              <Typography variant="h4" fontWeight="bold">
                {data.customerMarketPenetration.reduce((sum, country) => sum + country.customerCount, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Customers
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Customer Geographic Analytics Components */}
        <Grid container spacing={3}>
          {/* Customer Sales Heatmap */}
          <Grid item xs={12}>
            <CustomerSalesHeatmap data={data.customerSalesHeatmap} loading={loading} />
          </Grid>

          {/* Customer Views Heatmap */}
          <Grid item xs={12}>
            <CustomerViewsHeatmap data={data.customerViewsHeatmap} loading={loading} />
          </Grid>

          {/* Customer Regional Analysis */}
          <Grid item xs={12} lg={6}>
            <CustomerRegionalAnalysis 
              data={data.regionalCustomerAnalysis} 
              loading={loading} 
            />
          </Grid>

          {/* Customer Market Penetration */}
          <Grid item xs={12} lg={6}>
            <CustomerMarketPenetration 
              data={data.customerMarketPenetration} 
              loading={loading} 
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default CustomerGeographicAnalytics;