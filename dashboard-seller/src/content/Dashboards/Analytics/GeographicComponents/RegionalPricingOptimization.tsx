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
  Alert,
  Grid
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  Assessment,
  Lightbulb
} from '@mui/icons-material';

interface PricingOptimizationData {
  region: string;
  priceRange: string;
  sales: number;
  revenue: number;
  avgPrice: number;
  conversionRate: number;
}

interface RegionalPricingOptimizationProps {
  data: PricingOptimizationData[];
  loading: boolean;
}

function RegionalPricingOptimization({ data, loading }: RegionalPricingOptimizationProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title={<Skeleton width="60%" />} />
        <CardContent>
          <Skeleton height={250} />
        </CardContent>
      </Card>
    );
  }

  // Group data by region
  const regionData = data.reduce((acc, item) => {
    if (!acc[item.region]) {
      acc[item.region] = [];
    }
    acc[item.region].push(item);
    return acc;
  }, {} as { [key: string]: PricingOptimizationData[] });

  // Calculate regional insights
  const regionalInsights = Object.entries(regionData).map(([region, prices]) => {
    const totalSales = prices.reduce((sum, p) => sum + p.sales, 0);
    const totalRevenue = prices.reduce((sum, p) => sum + p.revenue, 0);
    const avgPrice = totalRevenue / totalSales || 0;
    const bestPriceRange = prices.sort((a, b) => b.sales - a.sales)[0];
    
    return {
      region,
      totalSales,
      totalRevenue,
      avgPrice,
      bestPriceRange: bestPriceRange?.priceRange || 'N/A',
      bestPriceRangeSales: bestPriceRange?.sales || 0,
      priceRanges: prices.sort((a, b) => b.sales - a.sales)
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  const getRegionFlag = (region: string) => {
    const flags: { [key: string]: string } = {
      'North America': '🇺🇸',
      'Europe': '🇪🇺',
      'Asia': '🌏',
      'Oceania': '🇦🇺',
      'South America': '🇧🇷',
      'Africa': '🌍',
      'Global': '🌍',
      'Other': '🌐'
    };
    return flags[region] || '🌐';
  };

  const getPriceRangeColor = (priceRange: string) => {
    switch (priceRange) {
      case 'Under $10': return theme.palette.success.main;
      case '$10-$25': return theme.palette.info.main;
      case '$25-$50': return theme.palette.warning.main;
      case '$50-$100': return theme.palette.error.main;
      case 'Over $100': return theme.palette.secondary.main;
      default: return theme.palette.grey[500];
    }
  };

  const maxSales = Math.max(...regionalInsights.map(r => r.totalSales));

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <AttachMoney color="primary" />
            <Typography variant="h6">Regional Pricing Optimization</Typography>
          </Box>
        }
        subheader="Best performing price ranges by region"
      />
      <CardContent>
        {/* Regional Pricing Performance */}
        <Box mb={3}>
          {regionalInsights.map((region, index) => (
            <Box key={region.region} mb={3}>
              {/* Region Header */}
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography variant="h5">
                  {getRegionFlag(region.region)}
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {region.region}
                </Typography>
                {index === 0 && (
                  <Chip label="Top Market" size="small" color="primary" />
                )}
              </Box>

              {/* Region Summary */}
              <Grid container spacing={2} mb={2}>
                <Grid item xs={4}>
                  <Box textAlign="center" p={1} bgcolor="primary.light" borderRadius={1} color="primary.contrastText">
                    <Typography variant="h6">
                      {region.totalSales.toLocaleString()}
                    </Typography>
                    <Typography variant="caption">
                      Total Sales
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" p={1} bgcolor="success.light" borderRadius={1} color="success.contrastText">
                    <Typography variant="h6">
                      ${region.avgPrice.toFixed(2)}
                    </Typography>
                    <Typography variant="caption">
                      Avg Price
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" p={1} bgcolor="warning.light" borderRadius={1} color="warning.contrastText">
                    <Typography variant="h6">
                      {region.bestPriceRange}
                    </Typography>
                    <Typography variant="caption">
                      Best Range
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Price Range Performance */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Price Range Performance:
                </Typography>
                {region.priceRanges.map((priceData, priceIndex) => {
                  const percentage = region.totalSales > 0 ? (priceData.sales / region.totalSales) * 100 : 0;
                  
                  return (
                    <Box key={priceData.priceRange} mb={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: getPriceRangeColor(priceData.priceRange)
                            }}
                          />
                          <Typography variant="body2">
                            {priceData.priceRange}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {priceData.sales} sales
                          </Typography>
                          <Chip
                            label={`${percentage.toFixed(1)}%`}
                            size="small"
                            sx={{
                              bgcolor: getPriceRangeColor(priceData.priceRange),
                              color: 'white'
                            }}
                          />
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getPriceRangeColor(priceData.priceRange)
                          }
                        }}
                      />
                      <Box display="flex" justifyContent="space-between" mt={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          Revenue: ${priceData.revenue.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg: ${priceData.avgPrice.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Box>

        {/* Pricing Insights & Recommendations */}
        <Box>
          <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
            <Lightbulb color="warning" />
            Pricing Optimization Insights
          </Typography>
          
          {regionalInsights.length > 0 && (
            <Box display="flex" flexDirection="column" gap={1}>
              {/* Top performing price range globally */}
              {(() => {
                const allPriceRanges = data.reduce((acc, item) => {
                  if (!acc[item.priceRange]) {
                    acc[item.priceRange] = { sales: 0, revenue: 0 };
                  }
                  acc[item.priceRange].sales += item.sales;
                  acc[item.priceRange].revenue += item.revenue;
                  return acc;
                }, {} as { [key: string]: { sales: number; revenue: number } });

                const topPriceRange = Object.entries(allPriceRanges)
                  .sort(([,a], [,b]) => b.sales - a.sales)[0];

                return (
                  <Alert severity="success" sx={{ mb: 1 }}>
                    <Typography variant="body2">
                      <strong>🎯 Sweet Spot:</strong> {topPriceRange?.[0]} is your best performing price range globally with {topPriceRange?.[1].sales.toLocaleString()} sales
                    </Typography>
                  </Alert>
                );
              })()}

              {/* Regional pricing recommendations */}
              {regionalInsights.slice(0, 2).map((region) => (
                <Alert severity="info" key={region.region} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>💡 {region.region}:</strong> Focus on {region.bestPriceRange} pricing - it drives {((region.bestPriceRangeSales / region.totalSales) * 100).toFixed(1)}% of your sales in this region
                  </Typography>
                </Alert>
              ))}

              {/* Price elasticity insight */}
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>📊 Market Analysis:</strong> You're active across {Object.keys(regionData).length} regions with varying price sensitivities. Consider region-specific pricing strategies for maximum revenue.
                </Typography>
              </Alert>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default RegionalPricingOptimization;