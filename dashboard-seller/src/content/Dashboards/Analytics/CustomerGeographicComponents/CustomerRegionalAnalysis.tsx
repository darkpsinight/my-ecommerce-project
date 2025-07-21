import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Skeleton,
  useTheme,
  Grid,
  Alert
} from '@mui/material';
import {
  Assessment,
  AttachMoney,
  TrendingUp,
  Lightbulb
} from '@mui/icons-material';

interface CustomerRegionalAnalysisData {
  country: string;
  priceRange: string;
  sales: number;
  revenue: number;
  avgPrice: number;
  orders: number;
}

interface CustomerRegionalAnalysisProps {
  data: CustomerRegionalAnalysisData[];
  loading: boolean;
}

function CustomerRegionalAnalysis({ data, loading }: CustomerRegionalAnalysisProps) {
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

  const getCountryFlag = (country: string) => {
    const flagMap: { [key: string]: string } = {
      'United States': '🇺🇸', 'Canada': '🇨🇦', 'United Kingdom': '🇬🇧', 
      'Germany': '🇩🇪', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸', 
      'Netherlands': '🇳🇱', 'Australia': '🇦🇺', 'Japan': '🇯🇵', 'South Korea': '🇰🇷', 
      'China': '🇨🇳', 'India': '🇮🇳', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽',
      'Russia': '🇷🇺', 'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰', 
      'Finland': '🇫🇮', 'Poland': '🇵🇱', 'Czech Republic': '🇨🇿', 
      'Austria': '🇦🇹', 'Switzerland': '🇨🇭', 'Belgium': '🇧🇪'
    };
    
    return flagMap[country] || '🌍';
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

  if (!data.length) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <Assessment color="primary" />
              <Typography variant="h6">Customer Regional Analysis</Typography>
            </Box>
          }
          subheader="No customer pricing data available yet"
        />
        <CardContent>
          <Alert severity="info">
            <Typography variant="body2">
              Customer pricing preferences by region will appear here once you have sales data.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Group data by country
  const countryData = data.reduce((acc, item) => {
    if (!acc[item.country]) {
      acc[item.country] = [];
    }
    acc[item.country].push(item);
    return acc;
  }, {} as { [key: string]: CustomerRegionalAnalysisData[] });

  // Calculate country insights
  const countryInsights = Object.entries(countryData).map(([country, prices]) => {
    const totalSales = prices.reduce((sum, p) => sum + p.sales, 0);
    const totalRevenue = prices.reduce((sum, p) => sum + p.revenue, 0);
    const avgPrice = totalRevenue / totalSales || 0;
    const bestPriceRange = prices.sort((a, b) => b.sales - a.sales)[0];
    
    return {
      country,
      totalSales,
      totalRevenue,
      avgPrice,
      bestPriceRange: bestPriceRange?.priceRange || 'N/A',
      bestPriceRangeSales: bestPriceRange?.sales || 0,
      priceRanges: prices.sort((a, b) => b.sales - a.sales)
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  const maxSales = Math.max(...countryInsights.map(c => c.totalSales));

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Assessment color="primary" />
            <Typography variant="h6">Customer Regional Analysis</Typography>
          </Box>
        }
        subheader="Price preferences by customer location"
      />
      <CardContent>
        {/* Country Price Analysis */}
        <Box mb={3}>
          {countryInsights.slice(0, 6).map((country, index) => (
            <Box key={country.country} mb={3}>
              {/* Country Header */}
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Typography variant="h5">
                  {getCountryFlag(country.country)}
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {country.country}
                </Typography>
                {index === 0 && (
                  <Chip label="Top Market" size="small" color="primary" />
                )}
              </Box>

              {/* Country Summary */}
              <Grid container spacing={2} mb={2}>
                <Grid item xs={4}>
                  <Box textAlign="center" p={1} bgcolor="primary.light" borderRadius={1} color="primary.contrastText">
                    <Typography variant="h6">
                      {country.totalSales.toLocaleString()}
                    </Typography>
                    <Typography variant="caption">
                      Sales
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" p={1} bgcolor="success.light" borderRadius={1} color="success.contrastText">
                    <Typography variant="h6">
                      ${country.avgPrice.toFixed(2)}
                    </Typography>
                    <Typography variant="caption">
                      Avg Price
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box textAlign="center" p={1} bgcolor="warning.light" borderRadius={1} color="warning.contrastText">
                    <Typography variant="h6">
                      {country.bestPriceRange}
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
                {country.priceRanges.map((priceData, priceIndex) => {
                  const percentage = country.totalSales > 0 ? (priceData.sales / country.totalSales) * 100 : 0;
                  
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

        {/* Regional Pricing Insights */}
        <Box>
          <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
            <Lightbulb color="warning" />
            Customer Pricing Insights
          </Typography>
          
          {countryInsights.length > 0 && (
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
                      <strong>💰 Customer Preference:</strong> {topPriceRange?.[0]} is most popular globally with {topPriceRange?.[1].sales.toLocaleString()} sales from customers
                    </Typography>
                  </Alert>
                );
              })()}

              {/* Regional pricing recommendations */}
              {countryInsights.slice(0, 2).map((country) => (
                <Alert severity="info" key={country.country} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>🎯 {getCountryFlag(country.country)} {country.country}:</strong> Customers prefer {country.bestPriceRange} - represents {((country.bestPriceRangeSales / country.totalSales) * 100).toFixed(1)}% of sales
                  </Typography>
                </Alert>
              ))}

              {/* Market opportunity */}
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>📊 Market Opportunity:</strong> You have customers in {Object.keys(countryData).length} countries with varying price preferences. Consider regional pricing strategies.
                </Typography>
              </Alert>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default CustomerRegionalAnalysis;