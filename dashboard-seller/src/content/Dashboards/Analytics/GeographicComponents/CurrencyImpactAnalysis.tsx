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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Assessment,
  Info,
  Warning
} from '@mui/icons-material';

interface CurrencyAnalysisData {
  currency: string;
  regionalPerformance: Array<{
    region: string;
    period: {
      year: number;
      month: number;
    };
    sales: number;
    revenue: number;
    avgPrice: number;
    orders: number;
  }>;
  priceImpact: Array<{
    region: string;
    avgOrderValue: number;
    priceElasticity: number;
  }>;
}

interface CurrencyImpactAnalysisProps {
  data: CurrencyAnalysisData;
  loading: boolean;
}

function CurrencyImpactAnalysis({ data, loading }: CurrencyImpactAnalysisProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Card>
        <CardHeader title={<Skeleton width="60%" />} />
        <CardContent>
          <Skeleton height={300} />
        </CardContent>
      </Card>
    );
  }

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

  // Group performance data by region for trend analysis
  const regionalTrends = data.regionalPerformance.reduce((acc, item) => {
    if (!acc[item.region]) {
      acc[item.region] = [];
    }
    acc[item.region].push(item);
    return acc;
  }, {} as { [key: string]: typeof data.regionalPerformance });

  // Calculate regional summaries
  const regionalSummaries = Object.entries(regionalTrends).map(([region, trends]) => {
    const totalSales = trends.reduce((sum, t) => sum + t.sales, 0);
    const totalRevenue = trends.reduce((sum, t) => sum + t.revenue, 0);
    const avgPrice = totalRevenue / totalSales || 0;
    const totalOrders = trends.reduce((sum, t) => sum + t.orders, 0);
    
    // Calculate trend (comparing first and last period)
    const sortedTrends = trends.sort((a, b) => 
      new Date(a.period.year, a.period.month - 1).getTime() - 
      new Date(b.period.year, b.period.month - 1).getTime()
    );
    
    const firstPeriod = sortedTrends[0];
    const lastPeriod = sortedTrends[sortedTrends.length - 1];
    const revenueTrend = firstPeriod && lastPeriod && firstPeriod.revenue > 0 
      ? ((lastPeriod.revenue - firstPeriod.revenue) / firstPeriod.revenue) * 100 
      : 0;
    
    const priceImpactData = data.priceImpact.find(p => p.region === region);
    
    return {
      region,
      totalSales,
      totalRevenue,
      avgPrice,
      totalOrders,
      revenueTrend,
      priceElasticity: priceImpactData?.priceElasticity || 0,
      avgOrderValue: priceImpactData?.avgOrderValue || 0,
      periods: trends.length
    };
  }).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const getElasticityColor = (elasticity: number) => {
    if (elasticity > 2) return theme.palette.success.main;
    if (elasticity > 1) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getElasticityLabel = (elasticity: number) => {
    if (elasticity > 2) return 'High Sensitivity';
    if (elasticity > 1) return 'Moderate Sensitivity';
    return 'Low Sensitivity';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp color="success" />;
    if (trend < -5) return <TrendingDown color="error" />;
    return <Assessment color="info" />;
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <AttachMoney color="primary" />
            <Typography variant="h6">Currency Impact Analysis</Typography>
            <Chip 
              label={data.currency} 
              size="small" 
              color="primary" 
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        }
        subheader="Price sensitivity and purchasing power analysis by region"
      />
      <CardContent>
        {/* USD-Only Notice */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>💰 Single Currency Analysis:</strong> Currently analyzing {data.currency} transactions only. 
            Multi-currency support would provide deeper insights into exchange rate impacts and regional purchasing power.
          </Typography>
        </Alert>

        {/* Regional Price Sensitivity Overview */}
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom display="flex" alignItems="center" gap={1}>
            <Assessment color="primary" />
            Regional Price Sensitivity & Performance
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Region</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Avg Price</TableCell>
                  <TableCell align="right">Order Value</TableCell>
                  <TableCell align="center">Price Sensitivity</TableCell>
                  <TableCell align="center">Trend</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {regionalSummaries.map((region) => (
                  <TableRow key={region.region}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">
                          {getRegionFlag(region.region)}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {region.region}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold" color="success.main">
                        ${region.totalRevenue.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        ${region.avgPrice.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        ${region.avgOrderValue.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getElasticityLabel(region.priceElasticity)}
                        size="small"
                        sx={{
                          bgcolor: getElasticityColor(region.priceElasticity),
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        {getTrendIcon(region.revenueTrend)}
                        <Typography variant="caption" color="text.secondary">
                          {region.revenueTrend > 0 ? '+' : ''}{region.revenueTrend.toFixed(1)}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Price Elasticity Analysis */}
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom>
            Price Elasticity by Region
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            How responsive customers are to price changes in each region
          </Typography>
          
          {regionalSummaries.map((region) => (
            <Box key={region.region} mb={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">
                    {getRegionFlag(region.region)} {region.region}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2">
                    Elasticity: {region.priceElasticity.toFixed(2)}
                  </Typography>
                  <Chip
                    label={getElasticityLabel(region.priceElasticity)}
                    size="small"
                    sx={{
                      bgcolor: getElasticityColor(region.priceElasticity),
                      color: 'white'
                    }}
                  />
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(region.priceElasticity * 25, 100)} // Scale for visualization
                sx={{
                  height: 8,
                  borderRadius: 4,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: getElasticityColor(region.priceElasticity)
                  }
                }}
              />
              <Box display="flex" justifyContent="space-between" mt={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Avg Order: ${region.avgOrderValue.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {region.totalSales.toLocaleString()} sales
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Regional Performance Trends */}
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom>
            Monthly Performance Trends
          </Typography>
          
          <Grid container spacing={2}>
            {regionalSummaries.slice(0, 4).map((region) => {
              const regionTrends = regionalTrends[region.region] || [];
              const sortedTrends = regionTrends.sort((a, b) => 
                new Date(a.period.year, a.period.month - 1).getTime() - 
                new Date(b.period.year, b.period.month - 1).getTime()
              );
              
              return (
                <Grid item xs={12} sm={6} key={region.region}>
                  <Box
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.default'
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="body2">
                        {getRegionFlag(region.region)}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {region.region}
                      </Typography>
                      {getTrendIcon(region.revenueTrend)}
                    </Box>
                    
                    <Box mb={2}>
                      <Typography variant="h6" color="primary">
                        ${region.totalRevenue.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Revenue ({region.periods} periods)
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="text.secondary">
                        Trend: {region.revenueTrend > 0 ? '+' : ''}{region.revenueTrend.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg: ${region.avgPrice.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Currency Impact Insights */}
        <Box>
          <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            Currency Impact Insights
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={1}>
            {/* Price sensitivity insight */}
            {(() => {
              const highSensitivityRegions = regionalSummaries.filter(r => r.priceElasticity > 2);
              const lowSensitivityRegions = regionalSummaries.filter(r => r.priceElasticity < 1);
              
              return (
                <>
                  {highSensitivityRegions.length > 0 && (
                    <Alert severity="success">
                      <Typography variant="body2">
                        <strong>💰 Price Sensitive Markets:</strong> {highSensitivityRegions.map(r => r.region).join(', ')} show high price sensitivity - competitive pricing is crucial here
                      </Typography>
                    </Alert>
                  )}
                  
                  {lowSensitivityRegions.length > 0 && (
                    <Alert severity="info">
                      <Typography variant="body2">
                        <strong>💎 Premium Markets:</strong> {lowSensitivityRegions.map(r => r.region).join(', ')} show low price sensitivity - potential for premium pricing strategies
                      </Typography>
                    </Alert>
                  )}
                </>
              );
            })()}

            {/* Growth opportunity */}
            {(() => {
              const growingRegions = regionalSummaries.filter(r => r.revenueTrend > 10);
              if (growingRegions.length > 0) {
                return (
                  <Alert severity="success">
                    <Typography variant="body2">
                      <strong>📈 Growing Markets:</strong> {growingRegions.map(r => r.region).join(', ')} showing strong growth trends - consider increased focus and inventory
                    </Typography>
                  </Alert>
                );
              }
              return null;
            })()}

            {/* Multi-currency recommendation */}
            <Alert severity="warning">
              <Typography variant="body2">
                <strong>🌍 Multi-Currency Opportunity:</strong> Consider implementing multi-currency support to reduce conversion friction and better serve international customers. This could increase conversion rates by 15-30% in non-USD regions.
              </Typography>
            </Alert>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default CurrencyImpactAnalysis;