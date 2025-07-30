import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { Assessment, TrendingUp } from '@mui/icons-material';
import { CTRData } from '../../services/api/analytics';

interface CTRDashboardProps {
  ctrData: CTRData;
  timeRange: string;
}

const CTRDashboard: React.FC<CTRDashboardProps> = ({ ctrData, timeRange }) => {
  const getCTRColor = (ctr: number) => {
    if (ctr >= 5) return 'text-green-600';
    if (ctr >= 2) return 'text-blue-600';
    if (ctr >= 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCTRBadgeColor = (
    ctr: number
  ): 'success' | 'warning' | 'error' | 'info' => {
    if (ctr >= 5) return 'success';
    if (ctr >= 2) return 'info';
    if (ctr >= 1) return 'warning';
    return 'error';
  };

  const getPerformanceLabel = (ctr: number) => {
    if (ctr >= 5) return 'Excellent';
    if (ctr >= 2) return 'Good';
    if (ctr >= 1) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title={
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="h6">Total Impressions</Typography>
                  <span style={{ fontSize: '1.5rem' }}>👁️</span>
                </Box>
              }
            />
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {ctrData.totalImpressions.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Times your listings were shown
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title={
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="h6">Total Clicks</Typography>
                  <span style={{ fontSize: '1.5rem' }}>🖱️</span>
                </Box>
              }
            />
            <CardContent>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                {ctrData.totalClicks.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Times users clicked your listings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              title={
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography variant="h6">Overall CTR</Typography>
                  <span style={{ fontSize: '1.5rem' }}>📊</span>
                </Box>
              }
            />
            <CardContent>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 'bold',
                  mb: 1,
                  color:
                    ctrData.overallCTR >= 5
                      ? 'success.main'
                      : ctrData.overallCTR >= 2
                      ? 'info.main'
                      : ctrData.overallCTR >= 1
                      ? 'warning.main'
                      : 'error.main'
                }}
              >
                {ctrData.overallCTR}%
              </Typography>
              <Chip
                label={getPerformanceLabel(ctrData.overallCTR)}
                color={getCTRBadgeColor(ctrData.overallCTR)}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* CTR by Source */}
      {ctrData.ctrBySource && ctrData.ctrBySource.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Click-Through Rate by Traffic Source"
            avatar={<Assessment color="primary" />}
          />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {ctrData.ctrBySource.map((source, index) => (
                <Box key={index}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography
                      variant="body1"
                      sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
                    >
                      {source.source.replace('_', ' ')}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 'bold',
                        color:
                          source.clickThroughRate >= 5
                            ? 'success.main'
                            : source.clickThroughRate >= 2
                            ? 'info.main'
                            : source.clickThroughRate >= 1
                            ? 'warning.main'
                            : 'error.main'
                      }}
                    >
                      {source.clickThroughRate}%
                    </Typography>
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                  >
                    <Typography variant="caption" color="textSecondary">
                      {source.totalImpressions} impressions
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {source.totalClicks} clicks
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(source.clickThroughRate * 10, 100)}
                    color={
                      source.clickThroughRate >= 5
                        ? 'success'
                        : source.clickThroughRate >= 2
                        ? 'info'
                        : source.clickThroughRate >= 1
                        ? 'warning'
                        : 'error'
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Top CTR Listings */}
      {ctrData.topCTRListings && ctrData.topCTRListings.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Top Performing Listings by CTR"
            avatar={<TrendingUp color="primary" />}
          />
          <CardContent>
            <List>
              {ctrData.topCTRListings.map((listing, index) => (
                <ListItem
                  key={index}
                  sx={{
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          listing.clickThroughRate >= 5
                            ? 'success.main'
                            : listing.clickThroughRate >= 2
                            ? 'info.main'
                            : listing.clickThroughRate >= 1
                            ? 'warning.main'
                            : 'error.main',
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
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: 'medium' }}
                          >
                            {listing.title}
                          </Typography>
                          <Chip
                            label={listing.platform}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Box textAlign="right">
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 'bold',
                              color:
                                listing.clickThroughRate >= 5
                                  ? 'success.main'
                                  : listing.clickThroughRate >= 2
                                  ? 'info.main'
                                  : listing.clickThroughRate >= 1
                                  ? 'warning.main'
                                  : 'error.main'
                            }}
                          >
                            {listing.clickThroughRate}%
                          </Typography>
                          <Chip
                            label={getPerformanceLabel(
                              listing.clickThroughRate
                            )}
                            color={getCTRBadgeColor(listing.clickThroughRate)}
                            size="small"
                          />
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="textSecondary">
                        {listing.totalImpressions} impressions •{' '}
                        {listing.totalClicks} clicks
                        {listing.avgClickDelay &&
                          ` • Avg delay: ${listing.avgClickDelay}s`}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Position Analysis */}
      {ctrData.positionAnalysis && ctrData.positionAnalysis.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="CTR by Listing Position"
            avatar={<Assessment color="primary" />}
          />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {ctrData.positionAnalysis.map((position, index) => (
                <Box
                  key={index}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip
                      label={`Position ${position.position}`}
                      variant="outlined"
                      size="small"
                    />
                    <Typography variant="body2">
                      {position.totalImpressions} impressions,{' '}
                      {position.totalClicks} clicks
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 'bold',
                        color:
                          position.clickThroughRate >= 5
                            ? 'success.main'
                            : position.clickThroughRate >= 2
                            ? 'info.main'
                            : position.clickThroughRate >= 1
                            ? 'warning.main'
                            : 'error.main'
                      }}
                    >
                      {position.clickThroughRate}%
                    </Typography>
                    {position.avgClickDelay && (
                      <Typography variant="caption" color="textSecondary">
                        ({position.avgClickDelay}s)
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* CTR Insights */}
      <Card>
        <CardHeader
          title="CTR Insights & Recommendations"
          avatar={<Assessment color="primary" />}
        />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {ctrData.overallCTR < 1 && (
              <Alert severity="error">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Low CTR Alert
                </Typography>
                <Typography variant="body2">
                  Your overall CTR is below 1%. Consider improving your listing
                  titles, images, and pricing.
                </Typography>
              </Alert>
            )}

            {ctrData.overallCTR >= 5 && (
              <Alert severity="success">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Excellent Performance!
                </Typography>
                <Typography variant="body2">
                  Your CTR is excellent! Your listings are very compelling to
                  users.
                </Typography>
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 'bold', mb: 1 }}
                >
                  CTR Benchmarks:
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography
                    component="li"
                    variant="body2"
                    color="success.main"
                  >
                    • Excellent: 5%+
                  </Typography>
                  <Typography component="li" variant="body2" color="info.main">
                    • Good: 2-5%
                  </Typography>
                  <Typography
                    component="li"
                    variant="body2"
                    color="warning.main"
                  >
                    • Average: 1-2%
                  </Typography>
                  <Typography component="li" variant="body2" color="error.main">
                    • Needs Work: &lt;1%
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 'bold', mb: 1 }}
                >
                  Improvement Tips:
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography
                    component="li"
                    variant="body2"
                    color="textSecondary"
                  >
                    • Optimize listing titles
                  </Typography>
                  <Typography
                    component="li"
                    variant="body2"
                    color="textSecondary"
                  >
                    • Use high-quality images
                  </Typography>
                  <Typography
                    component="li"
                    variant="body2"
                    color="textSecondary"
                  >
                    • Competitive pricing
                  </Typography>
                  <Typography
                    component="li"
                    variant="body2"
                    color="textSecondary"
                  >
                    • Clear product descriptions
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CTRDashboard;
