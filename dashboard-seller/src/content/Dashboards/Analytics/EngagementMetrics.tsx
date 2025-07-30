import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Visibility,
  RemoveRedEye,
  TrendingUp,
  People,
  Assessment,
  TouchApp
} from '@mui/icons-material';
import { EngagementData } from 'src/services/api/analytics';

interface EngagementMetricsProps {
  data?: EngagementData;
  loading: boolean;
}

function EngagementMetrics({ data, loading }: EngagementMetricsProps) {
  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'homepage':
        return '🏠';
      case 'search':
        return '🔍';
      case 'category':
        return '📂';
      case 'recommendation':
        return '⭐';
      case 'related':
        return '🔗';
      case 'seller_profile':
        return '👤';
      case 'wishlist':
        return '❤️';
      case 'direct':
        return '🎯';
      default:
        return '📱';
    }
  };

  const getSourceColor = (index: number): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
    const colors: Array<'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = 
      ['primary', 'secondary', 'success', 'warning', 'error', 'info'];
    return colors[index % colors.length];
  };

  const getPlatformColor = (platform: string) => {
    const colors: { [key: string]: string } = {
      'Steam': '#1976d2',
      'Epic Games': '#000000',
      'PlayStation': '#003087',
      'Xbox': '#107c10',
      'Nintendo': '#e60012',
      'Origin': '#ff6600',
      'Uplay': '#0099ff'
    };
    return colors[platform] || '#757575';
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Engagement Metrics" />
        <CardContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} height={60} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const totalViews = data?.totalViews || 0;
  const maxViews = data?.topViewedListings?.length > 0 
    ? Math.max(...data.topViewedListings.map(item => item.viewCount)) 
    : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Engagement Metrics"
        subheader="Listing views and user engagement"
        avatar={<Visibility color="primary" />}
      />
      <CardContent>
        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={1} color="primary.contrastText">
              <Typography variant="h4">
                {totalViews.toLocaleString()}
              </Typography>
              <Typography variant="caption">
                Total Views
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="secondary.light" borderRadius={1} color="secondary.contrastText">
              <Typography variant="h4">
                {(data?.uniqueViewers || 0).toLocaleString()}
              </Typography>
              <Typography variant="caption">
                Unique Viewers
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={1} color="success.contrastText">
              <Typography variant="h4">
                {data?.avgViewsPerListing || 0}
              </Typography>
              <Typography variant="caption">
                Avg Views/Listing
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="warning.light" borderRadius={1} color="warning.contrastText">
              <Typography variant="h4">
                {data?.conversionRate || 0}%
              </Typography>
              <Typography variant="caption">
                Conversion Rate
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Time Tracking Metrics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="info.light" borderRadius={1} color="info.contrastText">
              <Typography variant="h4">
                {data?.avgTimeOnPage || 0}s
              </Typography>
              <Typography variant="caption">
                Avg Time on Page
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="error.light" borderRadius={1} color="error.contrastText">
              <Typography variant="h4">
                {data?.totalTimeSpent || 0}m
              </Typography>
              <Typography variant="caption">
                Total Time Spent
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="grey.600" borderRadius={1} color="white">
              <Typography variant="h4">
                {data?.viewsWithDuration || 0}
              </Typography>
              <Typography variant="caption">
                Views with Duration
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center" p={2} bgcolor="purple" borderRadius={1} color="white">
              <Typography variant="h4">
                {data?.viewsWithDuration && totalViews > 0 
                  ? ((data.viewsWithDuration / totalViews) * 100).toFixed(1)
                  : 0}%
              </Typography>
              <Typography variant="caption">
                Tracking Coverage
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* CTR Metrics */}
        {data?.ctr && (
          <>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
              <Assessment />
              Click-Through Rate (CTR) Analytics
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4}>
                <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={1} color="primary.contrastText">
                  <Typography variant="h4">
                    {data.ctr.totalImpressions.toLocaleString()}
                  </Typography>
                  <Typography variant="caption">
                    Total Impressions
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Box textAlign="center" p={2} bgcolor="secondary.light" borderRadius={1} color="secondary.contrastText">
                  <Typography variant="h4">
                    {data.ctr.totalClicks.toLocaleString()}
                  </Typography>
                  <Typography variant="caption">
                    Total Clicks
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box 
                  textAlign="center" 
                  p={2} 
                  bgcolor={data.ctr.overallCTR >= 5 ? 'success.light' : data.ctr.overallCTR >= 2 ? 'warning.light' : 'error.light'} 
                  borderRadius={1} 
                  color={data.ctr.overallCTR >= 5 ? 'success.contrastText' : data.ctr.overallCTR >= 2 ? 'warning.contrastText' : 'error.contrastText'}
                >
                  <Typography variant="h4">
                    {data.ctr.overallCTR}%
                  </Typography>
                  <Typography variant="caption">
                    Overall CTR
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* CTR by Source */}
            {data.ctr.ctrBySource && data.ctr.ctrBySource.length > 0 && (
              <Box mb={3}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  CTR by Traffic Source
                </Typography>
                {data.ctr.ctrBySource.slice(0, 5).map((source, index) => (
                  <Box key={source.source} mb={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                      <Typography variant="body2">
                        {getSourceIcon(source.source)} {source.source.replace('_', ' ')}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="caption" color="textSecondary">
                          {source.totalImpressions} imp, {source.totalClicks} clicks
                        </Typography>
                        <Chip 
                          label={`${source.clickThroughRate}%`}
                          size="small"
                          color={source.clickThroughRate >= 5 ? 'success' : source.clickThroughRate >= 2 ? 'warning' : 'error'}
                        />
                      </Box>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(source.clickThroughRate * 10, 100)} // Scale for better visualization
                      color={source.clickThroughRate >= 5 ? 'success' : source.clickThroughRate >= 2 ? 'warning' : 'error'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Box>
            )}

            {/* Top CTR Listings */}
            {data.ctr.topCTRListings && data.ctr.topCTRListings.length > 0 && (
              <Box mb={3}>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Top CTR Listings
                </Typography>
                <List dense>
                  {data.ctr.topCTRListings.slice(0, 3).map((listing, index) => (
                    <ListItem key={listing.listingId} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: listing.clickThroughRate >= 5 ? 'success.main' : listing.clickThroughRate >= 2 ? 'warning.main' : 'error.main',
                            width: 32,
                            height: 32,
                            fontSize: '0.75rem'
                          }}
                        >
                          #{index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {listing.title}
                            </Typography>
                            <Chip 
                              label={`${listing.clickThroughRate}% CTR`}
                              size="small"
                              color={listing.clickThroughRate >= 5 ? 'success' : listing.clickThroughRate >= 2 ? 'warning' : 'error'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              {listing.platform} • {listing.totalImpressions} impressions • {listing.totalClicks} clicks
                              {listing.avgClickDelay && ` • ${listing.avgClickDelay}s avg delay`}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* CTR Insights */}
            <Box mb={3}>
              {data.ctr.overallCTR >= 5 && (
                <Alert severity="success" sx={{ mb: 1 }}>
                  🎉 Excellent CTR! Your listings are very compelling to users.
                </Alert>
              )}
              
              {data.ctr.overallCTR < 1 && data.ctr.totalImpressions > 100 && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  ⚠️ Low CTR detected. Consider improving listing titles, images, and pricing.
                </Alert>
              )}
              
              {data.ctr.overallCTR >= 2 && data.ctr.overallCTR < 5 && (
                <Alert severity="info" sx={{ mb: 1 }}>
                  👍 Good CTR! There's still room for optimization to reach excellent levels.
                </Alert>
              )}

              <Box p={2} bgcolor="background.default" borderRadius={1}>
                <Typography variant="caption" color="textSecondary" display="block">
                  <strong>CTR Benchmarks:</strong>
                </Typography>
                <Typography variant="caption" color="success.main" display="block">
                  • Excellent: 5%+ CTR
                </Typography>
                <Typography variant="caption" color="warning.main" display="block">
                  • Good: 2-5% CTR
                </Typography>
                <Typography variant="caption" color="info.main" display="block">
                  • Average: 1-2% CTR
                </Typography>
                <Typography variant="caption" color="error.main" display="block">
                  • Needs Work: &lt;1% CTR
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {/* Top Viewed Listings */}
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RemoveRedEye />
          Most Viewed Listings
        </Typography>
        
        {data?.topViewedListings && data.topViewedListings.length > 0 ? (
          <List dense sx={{ mb: 3 }}>
            {data.topViewedListings.slice(0, 5).map((listing, index) => {
              const progressValue = maxViews > 0 ? (listing.viewCount / maxViews) * 100 : 0;
              
              return (
                <ListItem key={listing.listingId} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: getPlatformColor(listing.platform),
                        width: 32,
                        height: 32,
                        fontSize: '0.75rem'
                      }}
                    >
                      #{index + 1}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: index < 3 ? 'bold' : 'normal',
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {listing.title}
                        </Typography>
                        <Chip 
                          label={`${listing.viewCount} views`}
                          size="small"
                          color={index === 0 ? 'primary' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="caption" color="textSecondary">
                            {listing.platform}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {listing.uniqueViewers} unique viewers
                          </Typography>
                        </Box>
                        {/* Time tracking metrics for this listing */}
                        {(listing.avgTimeOnPage || listing.totalTimeSpent) && (
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                            <Typography variant="caption" color="info.main">
                              ⏱️ Avg time: {listing.avgTimeOnPage || 0}s
                            </Typography>
                            <Typography variant="caption" color="info.main">
                              📊 Total: {listing.totalTimeSpent || 0}m
                            </Typography>
                          </Box>
                        )}
                        <LinearProgress 
                          variant="determinate" 
                          value={progressValue}
                          sx={{ 
                            height: 4,
                            borderRadius: 2,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: index === 0 ? 'primary.main' : 'secondary.main'
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
        ) : (
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            py={4}
            color="text.secondary"
            mb={3}
          >
            <Typography variant="body2">
              No view data available
            </Typography>
          </Box>
        )}

        {/* Views by Source */}
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TouchApp />
          Traffic Sources
        </Typography>
        
        {data?.viewsBySource && data.viewsBySource.length > 0 ? (
          <Box mb={3}>
            {data.viewsBySource.slice(0, 6).map((source, index) => {
              const percentage = totalViews > 0 ? ((source.count / totalViews) * 100) : 0;
              
              return (
                <Box key={source.source} mb={1}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {getSourceIcon(source.source)} {source.source.replace('_', ' ')}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {source.count.toLocaleString()}
                      </Typography>
                      <Chip 
                        label={`${percentage.toFixed(1)}%`}
                        size="small"
                        color={getSourceColor(index)}
                      />
                    </Box>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={percentage}
                    color={getSourceColor(index)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            py={4}
            color="text.secondary"
            mb={3}
          >
            <Typography variant="body2">
              No traffic source data available
            </Typography>
          </Box>
        )}

        {/* Insights */}
        {data && (
          <Box>
            {data.conversionRate > 5 && (
              <Alert severity="success" sx={{ mb: 1 }}>
                Great conversion rate! {data.conversionRate}% of viewers become customers.
              </Alert>
            )}
            
            {data.conversionRate < 1 && data.totalViews > 100 && (
              <Alert severity="info" sx={{ mb: 1 }}>
                Consider optimizing your listings - you have good traffic but low conversion.
              </Alert>
            )}
            
            {data.avgViewsPerListing < 5 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                Low visibility detected. Consider improving SEO and promotional strategies.
              </Alert>
            )}

            {/* Time-based insights */}
            {data.avgTimeOnPage > 60 && (
              <Alert severity="success" sx={{ mb: 1 }}>
                Excellent engagement! Users spend {data.avgTimeOnPage}s on average viewing your listings.
              </Alert>
            )}
            
            {data.avgTimeOnPage < 15 && data.avgTimeOnPage > 0 && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                Short viewing time detected. Consider improving listing descriptions and images.
              </Alert>
            )}
            
            {data.viewsWithDuration && totalViews > 0 && (data.viewsWithDuration / totalViews) < 0.5 && (
              <Alert severity="info" sx={{ mb: 1 }}>
                Time tracking coverage is {((data.viewsWithDuration / totalViews) * 100).toFixed(1)}%. Encourage users to enable JavaScript for better analytics.
              </Alert>
            )}

            <Box p={2} bgcolor="background.default" borderRadius={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <TrendingUp color="success" fontSize="small" />
                <Typography variant="caption" color="success.main">
                  Engagement Insights
                </Typography>
              </Box>
              <Typography variant="caption" color="textSecondary" display="block">
                • {data.uniqueViewers > 0 ? (data.totalViews / data.uniqueViewers).toFixed(1) : 0} avg views per visitor
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                • {data.topViewedListings?.length || 0} listings with views this period
              </Typography>
              {data.viewsBySource?.length > 0 && (
                <Typography variant="caption" color="textSecondary" display="block">
                  • Top traffic source: {data.viewsBySource[0].source.replace('_', ' ')}
                </Typography>
              )}
              {data.avgTimeOnPage > 0 && (
                <Typography variant="caption" color="textSecondary" display="block">
                  • Average engagement time: {data.avgTimeOnPage}s per listing view
                </Typography>
              )}
              {data.totalTimeSpent > 0 && (
                <Typography variant="caption" color="textSecondary" display="block">
                  • Total user engagement: {data.totalTimeSpent} minutes across all listings
                </Typography>
              )}
              {data.ctr && data.ctr.totalImpressions > 0 && (
                <Typography variant="caption" color="textSecondary" display="block">
                  • Click-through rate: {data.ctr.overallCTR}% ({data.ctr.totalClicks} clicks from {data.ctr.totalImpressions} impressions)
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default EngagementMetrics;