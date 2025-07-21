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
  Visibility,
  RemoveRedEye,
  People,
  TrendingUp,
  Public
} from '@mui/icons-material';

interface CustomerViewsHeatmapData {
  countries: Array<{
    country: string;
    countryCode: string;
    region: string;
    city: string;
    views: number;
    uniqueViewers: number;
    viewsPercentage: number;
    coordinates: {
      lat: number | null;
      lng: number | null;
    };
  }>;
  totalViews: number;
  totalCountries: number;
}

interface CustomerViewsHeatmapProps {
  data: CustomerViewsHeatmapData;
  loading: boolean;
}

function CustomerViewsHeatmap({ data, loading }: CustomerViewsHeatmapProps) {
  const theme = useTheme();

  const getCountryFlag = (countryCode: string) => {
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

  const getEngagementColor = (percentage: number) => {
    if (percentage >= 20) return theme.palette.error.main;
    if (percentage >= 10) return theme.palette.warning.main;
    if (percentage >= 5) return theme.palette.info.main;
    if (percentage >= 2) return theme.palette.success.main;
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
              <Visibility color="primary" />
              <Typography variant="h6">Customer Views Heatmap</Typography>
            </Box>
          }
          subheader="No customer view data available yet"
        />
        <CardContent>
          <Alert severity="info">
            <Typography variant="body2">
              Customer view locations will appear here as visitors browse your products. 
              Location data is automatically collected from visitor IP addresses.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const sortedCountries = [...data.countries].sort((a, b) => b.views - a.views);

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Visibility color="primary" />
            <Typography variant="h6">Customer Views Heatmap</Typography>
            <Chip 
              label={`${data.totalCountries} countries`} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          </Box>
        }
        subheader="Where your customers are viewing your products from"
      />
      <CardContent>
        {/* World Map Visualization */}
        <Box mb={4}>
          <Typography variant="subtitle1" gutterBottom>
            👀 Global Customer Interest
          </Typography>
          <Grid container spacing={2}>
            {sortedCountries.slice(0, 12).map((country, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={country.country}>
                <Box
                  sx={{
                    p: 2,
                    border: 2,
                    borderColor: getEngagementColor(country.viewsPercentage),
                    borderRadius: 2,
                    bgcolor: getEngagementColor(country.viewsPercentage) + '15',
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

                  {/* Views Progress */}
                  <Box mb={1} flex={1}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        Views
                      </Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {country.views.toLocaleString()}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={country.viewsPercentage}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        '& .MuiLinearProgress-bar': {
                          bgcolor: getEngagementColor(country.viewsPercentage)
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {country.viewsPercentage}% of total
                    </Typography>
                  </Box>

                  {/* Unique Viewers & Engagement */}
                  <Box display="flex" justifyContent="space-between">
                    <Box textAlign="center">
                      <Typography variant="body2" fontWeight="bold" color="info.main">
                        {country.uniqueViewers}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Viewers
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="body2" fontWeight="bold" color="secondary.main">
                        {country.views > 0 ? (country.views / country.uniqueViewers).toFixed(1) : '0'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avg/User
                      </Typography>
                    </Box>
                  </Box>

                  {/* Engagement Badge */}
                  <Box position="absolute" top={8} right={8}>
                    <Chip
                      label={`${country.viewsPercentage}%`}
                      size="small"
                      sx={{
                        bgcolor: getEngagementColor(country.viewsPercentage),
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
            📈 Detailed Customer Views by Country
          </Typography>
          <List>
            {sortedCountries.map((country, index) => {
              const avgViewsPerUser = country.uniqueViewers > 0 ? (country.views / country.uniqueViewers) : 0;
              
              return (
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
                            <Chip label="Most Interest" size="small" color="secondary" />
                          )}
                        </Box>
                        <Box display="flex" gap={1}>
                          <Chip
                            icon={<RemoveRedEye />}
                            label={`${country.views.toLocaleString()} views`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                          <Chip
                            icon={<People />}
                            label={`${country.uniqueViewers} viewers`}
                            size="small"
                            color="info"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="caption" color="text.secondary">
                            View Share: {country.viewsPercentage}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Avg Views/User: {avgViewsPerUser.toFixed(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Engagement: {avgViewsPerUser > 2 ? 'High' : avgViewsPerUser > 1 ? 'Medium' : 'Low'}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={country.viewsPercentage}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getEngagementColor(country.viewsPercentage)
                            }
                          }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Global View Insights */}
        <Box mt={3} p={2} bgcolor="background.default" borderRadius={2}>
          <Typography variant="subtitle2" gutterBottom color="secondary">
            👀 Global Customer Interest Insights
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • <strong>{sortedCountries[0]?.country}</strong> shows the most interest with {sortedCountries[0]?.viewsPercentage}% of views
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Customers from <strong>{data.totalCountries} countries</strong> have viewed your products
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Total customer views: <strong>{data.totalViews.toLocaleString()}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Top interest markets: {sortedCountries.slice(0, 3).map(c => `${getCountryFlag(c.countryCode)} ${c.country}`).join(', ')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default CustomerViewsHeatmap;