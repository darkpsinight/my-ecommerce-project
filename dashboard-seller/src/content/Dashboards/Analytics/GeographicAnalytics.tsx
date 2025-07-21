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
  Public,
  TrendingUp,
  AttachMoney,
  Assessment
} from '@mui/icons-material';
import { GeographicData } from 'src/services/api/analytics';
import SalesHeatmap from './GeographicComponents/SalesHeatmap';
import RegionalPricingOptimization from './GeographicComponents/RegionalPricingOptimization';
import MarketPenetration from './GeographicComponents/MarketPenetration';
import CurrencyImpactAnalysis from './GeographicComponents/CurrencyImpactAnalysis';

interface GeographicAnalyticsProps {
  data?: GeographicData;
  loading: boolean;
}

function GeographicAnalytics({ data, loading }: GeographicAnalyticsProps) {
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
          title="Geographic & Market Analytics"
          subheader="No geographic data available"
        />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Public color="primary" />
            <Typography variant="h6">Geographic & Market Analytics</Typography>
          </Box>
        }
        subheader="Global sales performance and market insights"
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
                {data.salesHeatmap.totalRegions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Regions
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
              <TrendingUp 
                sx={{ 
                  fontSize: 32, 
                  color: theme.palette.success.main,
                  mb: 1 
                }} 
              />
              <Typography variant="h4" fontWeight="bold">
                {data.salesHeatmap.totalSales.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Global Sales
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
              <AttachMoney 
                sx={{ 
                  fontSize: 32, 
                  color: theme.palette.warning.main,
                  mb: 1 
                }} 
              />
              <Typography variant="h4" fontWeight="bold">
                ${data.salesHeatmap.totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Global Revenue
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
              <Assessment 
                sx={{ 
                  fontSize: 32, 
                  color: theme.palette.info.main,
                  mb: 1 
                }} 
              />
              <Typography variant="h4" fontWeight="bold">
                {data.marketPenetration.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Market Segments
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Geographic Analytics Components */}
        <Grid container spacing={3}>
          {/* Sales Heatmap */}
          <Grid item xs={12}>
            <SalesHeatmap data={data.salesHeatmap} loading={loading} />
          </Grid>

          {/* Regional Pricing Optimization */}
          <Grid item xs={12} lg={6}>
            <RegionalPricingOptimization 
              data={data.pricingOptimization} 
              loading={loading} 
            />
          </Grid>

          {/* Market Penetration */}
          <Grid item xs={12} lg={6}>
            <MarketPenetration 
              data={data.marketPenetration} 
              loading={loading} 
            />
          </Grid>

          {/* Currency Impact Analysis */}
          <Grid item xs={12}>
            <CurrencyImpactAnalysis 
              data={data.currencyAnalysis} 
              loading={loading} 
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default GeographicAnalytics;