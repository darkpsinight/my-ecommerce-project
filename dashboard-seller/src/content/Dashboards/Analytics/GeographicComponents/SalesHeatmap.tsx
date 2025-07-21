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
  Grid
} from '@mui/material';
import {
  Public,
  TrendingUp,
  AttachMoney
} from '@mui/icons-material';

interface SalesHeatmapData {
  regions: Array<{
    region: string;
    sales: number;
    revenue: number;
    orders: number;
    avgOrderValue: number;
    salesPercentage: number;
    revenuePercentage: number;
    coordinates: {
      lat: number;
      lng: number;
      name: string;
    };
  }>;
  totalSales: number;
  totalRevenue: number;
  totalRegions: number;
}

interface SalesHeatmapProps {
  data: SalesHeatmapData;
  loading: boolean;
}

function SalesHeatmap({ data, loading }: SalesHeatmapProps) {
  const theme = useTheme();

  const getRegionColor = (percentage: number) => {
    if (percentage >= 30) return theme.palette.error.main;
    if (percentage >= 20) return theme.palette.warning.main;
    if (percentage >= 10) return theme.palette.info.main;
    if (percentage >= 5) return theme.palette.success.main;
    return theme.palette.grey[400];
  };

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

  const sortedRegions = [...data.regions].sort((a, b) => b.sales - a.sales);

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Public color="primary" />
            <Typography variant="h6">Sales Heatmap</Typography>
          </Box>
        }
        subheader="Global sales distribution by region"
      />
      <CardContent>
        {/* Visual Map Representation */}
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom>
            Regional Sales Distribution
          </Typography>
          <Grid container spacing={2}>
            {sortedRegions.map((region, index) => (
              <Grid item xs={12} sm={6} md={4} key={region.region}>
                <Box
                  sx={{
                    p: 2,
                    border: 2,
                    borderColor: getRegionColor(region.salesPercentage),
                    borderRadius: 2,
                    bgcolor: getRegionColor(region.salesPercentage) + '10',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Region Header */}
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography variant="h4">
                      {getRegionFlag(region.region)}
                    </Typography>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {region.region}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Rank #{index + 1}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Sales Metrics */}
                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        Sales
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {region.sales.toLocaleString()}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={region.salesPercentage}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getRegionColor(region.salesPercentage)
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {region.salesPercentage}% of total sales
                    </Typography>
                  </Box>

                  {/* Revenue & Orders */}
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Box textAlign="center" flex={1}>
                      <Typography variant="h6" color="success.main">
                        ${region.revenue.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Revenue
                      </Typography>
                    </Box>
                    <Box textAlign="center" flex={1}>
                      <Typography variant="h6" color="info.main">
                        {region.orders}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Orders
                      </Typography>
                    </Box>
                  </Box>

                  {/* Average Order Value */}
                  <Box textAlign="center" p={1} bgcolor="background.default" borderRadius={1}>
                    <Typography variant="body2" color="text.secondary">
                      Avg Order Value
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${region.avgOrderValue}
                    </Typography>
                  </Box>

                  {/* Performance Badge */}
                  <Box position="absolute" top={8} right={8}>
                    <Chip
                      label={`${region.salesPercentage}%`}
                      size="small"
                      sx={{
                        bgcolor: getRegionColor(region.salesPercentage),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Detailed Regional List */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Detailed Regional Performance
          </Typography>
          <List>
            {sortedRegions.map((region, index) => (
              <ListItem key={region.region} divider>
                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h5">
                          {getRegionFlag(region.region)}
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {region.region}
                        </Typography>
                        {index === 0 && (
                          <Chip label="Top Region" size="small" color="primary" />
                        )}
                      </Box>
                      <Box display="flex" gap={1}>
                        <Chip
                          icon={<TrendingUp />}
                          label={`${region.sales.toLocaleString()} sales`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          icon={<AttachMoney />}
                          label={`$${region.revenue.toLocaleString()}`}
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
                          Market Share: {region.salesPercentage}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Revenue Share: {region.revenuePercentage}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Avg Order: ${region.avgOrderValue}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={region.salesPercentage}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getRegionColor(region.salesPercentage)
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

        {/* Summary Insights */}
        <Box mt={3} p={2} bgcolor="background.default" borderRadius={2}>
          <Typography variant="subtitle2" gutterBottom color="primary">
            🌍 Global Market Insights
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • <strong>{sortedRegions[0]?.region}</strong> is your strongest market with {sortedRegions[0]?.salesPercentage}% of total sales
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • You're active in <strong>{data.totalRegions} regions</strong> with total sales of <strong>{data.totalSales.toLocaleString()} units</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Global revenue: <strong>${data.totalRevenue.toLocaleString()}</strong> across all markets
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default SalesHeatmap;