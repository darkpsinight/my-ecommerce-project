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
  Assessment,
  SportsEsports,
  TrendingUp,
  Public,
  Star
} from '@mui/icons-material';

interface MarketPenetrationData {
  region: string;
  platforms: Array<{
    platform: string;
    sales: number;
    revenue: number;
    uniqueProducts: number;
    orders: number;
  }>;
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  marketShare: number;
}

interface MarketPenetrationProps {
  data: MarketPenetrationData[];
  loading: boolean;
}

function MarketPenetration({ data, loading }: MarketPenetrationProps) {
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

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      'Steam': '#1976d2',
      'Epic Games': '#000000',
      'PlayStation': '#003087',
      'Xbox': '#107c10',
      'Nintendo': '#e60012',
      'Origin': '#ff6600',
      'Uplay': '#0099ff',
      'Battle.net': '#00aeff',
      'GOG': '#86328a'
    };
    return colors[platform] || theme.palette.grey[600];
  };

  const getPlatformIcon = (platform: string) => {
    // You could use actual platform icons here
    return '🎮';
  };

  // Calculate global platform performance
  const globalPlatformStats = data.reduce((acc, region) => {
    region.platforms.forEach(platform => {
      if (!acc[platform.platform]) {
        acc[platform.platform] = {
          totalSales: 0,
          totalRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          regions: 0
        };
      }
      acc[platform.platform].totalSales += platform.sales;
      acc[platform.platform].totalRevenue += platform.revenue;
      acc[platform.platform].totalOrders += platform.orders;
      acc[platform.platform].totalProducts += platform.uniqueProducts;
      acc[platform.platform].regions += 1;
    });
    return acc;
  }, {} as { [key: string]: any });

  const sortedRegions = [...data].sort((a, b) => b.totalSales - a.totalSales);
  const maxSales = Math.max(...data.map(r => r.totalSales));

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Assessment color="primary" />
            <Typography variant="h6">Market Penetration</Typography>
          </Box>
        }
        subheader="Your presence across regions and platforms"
      />
      <CardContent>
        {/* Global Platform Overview */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
            <SportsEsports color="primary" />
            Platform Performance Overview
          </Typography>
          <Grid container spacing={1}>
            {Object.entries(globalPlatformStats)
              .sort(([,a], [,b]) => b.totalSales - a.totalSales)
              .slice(0, 6)
              .map(([platform, stats]) => (
                <Grid item xs={6} sm={4} key={platform}>
                  <Box
                    sx={{
                      p: 1.5,
                      border: 1,
                      borderColor: getPlatformColor(platform),
                      borderRadius: 1,
                      bgcolor: getPlatformColor(platform) + '10'
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="body2">
                        {getPlatformIcon(platform)}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {platform}
                      </Typography>
                    </Box>
                    <Typography variant="h6" color="primary">
                      {stats.totalSales.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      sales in {stats.regions} regions
                    </Typography>
                  </Box>
                </Grid>
              ))}
          </Grid>
        </Box>

        {/* Regional Market Penetration */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
            <Public color="primary" />
            Regional Market Presence
          </Typography>
          
          {sortedRegions.map((region, index) => {
            const penetrationScore = (region.platforms.length / Object.keys(globalPlatformStats).length) * 100;
            const topPlatform = region.platforms.sort((a, b) => b.sales - a.sales)[0];
            
            return (
              <Box key={region.region} mb={2}>
                {/* Region Header */}
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h5">
                      {getRegionFlag(region.region)}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {region.region}
                    </Typography>
                    {index === 0 && (
                      <Chip label="Strongest Market" size="small" color="primary" />
                    )}
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={`${region.marketShare}% share`}
                      size="small"
                      color="secondary"
                    />
                    <Chip
                      label={`${region.platforms.length} platforms`}
                      size="small"
                      color="info"
                    />
                  </Box>
                </Box>

                {/* Market Penetration Progress */}
                <Box mb={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" color="text.secondary">
                      Market Penetration
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {penetrationScore.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={penetrationScore}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: penetrationScore > 70 ? 'success.main' : 
                                penetrationScore > 40 ? 'warning.main' : 'error.main'
                      }
                    }}
                  />
                </Box>

                {/* Platform Breakdown */}
                <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                  {region.platforms
                    .sort((a, b) => b.sales - a.sales)
                    .map((platform) => (
                      <Chip
                        key={platform.platform}
                        label={`${platform.platform}: ${platform.sales}`}
                        size="small"
                        sx={{
                          bgcolor: getPlatformColor(platform.platform),
                          color: 'white',
                          '& .MuiChip-label': {
                            fontSize: '0.7rem'
                          }
                        }}
                      />
                    ))}
                </Box>

                {/* Key Metrics */}
                <Grid container spacing={1}>
                  <Grid item xs={3}>
                    <Box textAlign="center" p={0.5} bgcolor="background.default" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary">
                        Sales
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {region.totalSales.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box textAlign="center" p={0.5} bgcolor="background.default" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary">
                        Revenue
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        ${region.totalRevenue.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box textAlign="center" p={0.5} bgcolor="background.default" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary">
                        Orders
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {region.totalOrders}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={3}>
                    <Box textAlign="center" p={0.5} bgcolor="background.default" borderRadius={1}>
                      <Typography variant="caption" color="text.secondary">
                        Top Platform
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" noWrap>
                        {topPlatform?.platform || 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            );
          })}
        </Box>

        {/* Market Penetration Insights */}
        <Box>
          <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
            <Star color="warning" />
            Market Penetration Insights
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={1}>
            {/* Strongest market */}
            {sortedRegions.length > 0 && (
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>🏆 Dominant Market:</strong> {sortedRegions[0].region} is your strongest market with {sortedRegions[0].marketShare}% market share across {sortedRegions[0].platforms.length} platforms
                </Typography>
              </Alert>
            )}

            {/* Platform diversification */}
            <Alert severity="info">
              <Typography variant="body2">
                <strong>🎮 Platform Reach:</strong> You're selling on {Object.keys(globalPlatformStats).length} different platforms across {data.length} regions
              </Typography>
            </Alert>

            {/* Expansion opportunities */}
            {(() => {
              const underPenetratedRegions = sortedRegions.filter(r => 
                (r.platforms.length / Object.keys(globalPlatformStats).length) * 100 < 50
              );
              
              if (underPenetratedRegions.length > 0) {
                return (
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>📈 Growth Opportunity:</strong> Consider expanding platform presence in {underPenetratedRegions.map(r => r.region).join(', ')} for increased market penetration
                    </Typography>
                  </Alert>
                );
              }
              return null;
            })()}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default MarketPenetration;