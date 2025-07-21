import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Skeleton,
  useTheme
} from '@mui/material';
import {
  FavoriteOutlined,
  PersonOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  ShoppingCartOutlined,
  StarOutlined
} from '@mui/icons-material';
import { WishlistData } from 'src/services/api/analytics';
import WishlistInsightsHelp from './WishlistInsightsHelp';

interface WishlistAnalyticsProps {
  data?: WishlistData;
  loading: boolean;
}

function WishlistAnalytics({ data, loading }: WishlistAnalyticsProps) {
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
              <Grid item xs={12} sm={6} key={item}>
                <Skeleton height={80} />
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
          title="Wishlist Analytics"
          subheader="No wishlist data available"
        />
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 15) return theme.palette.success.main;
    if (rate >= 10) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getAbandonmentColor = (rate: number) => {
    if (rate <= 20) return theme.palette.success.main;
    if (rate <= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <FavoriteOutlined color="primary" />
            <Typography variant="h6">Wishlist Analytics</Typography>
            <Chip 
              icon={<StarOutlined />} 
              label="Interest Insights" 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
        }
        subheader="Track customer interest and wishlist behavior"
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              p={2}
              bgcolor={theme.palette.primary.light + '20'}
              borderRadius={2}
              textAlign="center"
            >
              <FavoriteOutlined 
                sx={{ 
                  fontSize: 32, 
                  color: theme.palette.primary.main,
                  mb: 1 
                }} 
              />
              <Typography variant="h4" fontWeight="bold">
                {formatNumber(data.totalWishlistAdditions)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Wishlist Additions
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
              <PersonOutlined 
                sx={{ 
                  fontSize: 32, 
                  color: theme.palette.info.main,
                  mb: 1 
                }} 
              />
              <Typography variant="h4" fontWeight="bold">
                {formatNumber(data.uniqueWishlisters)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unique Wishlisters
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box
              p={2}
              bgcolor={getConversionColor(data.wishlistConversionRate) + '20'}
              borderRadius={2}
              textAlign="center"
            >
              <ShoppingCartOutlined 
                sx={{ 
                  fontSize: 32, 
                  color: getConversionColor(data.wishlistConversionRate),
                  mb: 1 
                }} 
              />
              <Typography variant="h4" fontWeight="bold">
                {data.wishlistConversionRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conversion Rate
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box
              p={2}
              bgcolor={getAbandonmentColor(data.wishlistAbandonmentRate) + '20'}
              borderRadius={2}
              textAlign="center"
            >
              <TrendingDownOutlined 
                sx={{ 
                  fontSize: 32, 
                  color: getAbandonmentColor(data.wishlistAbandonmentRate),
                  mb: 1 
                }} 
              />
              <Typography variant="h4" fontWeight="bold">
                {data.wishlistAbandonmentRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Abandonment Rate
              </Typography>
            </Box>
          </Grid>

          {/* Most Wishlisted Products */}
          <Grid item xs={12} lg={6}>
            <Box>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <TrendingUpOutlined color="primary" />
                Most Wishlisted Products
              </Typography>
              {data.mostWishlistedProducts.length > 0 ? (
                <List dense>
                  {data.mostWishlistedProducts.slice(0, 5).map((product, index) => (
                    <ListItem key={product.listingId} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" noWrap sx={{ maxWidth: '60%' }}>
                              {product.title}
                            </Typography>
                            <Chip 
                              label={`${product.wishlistCount} wishlists`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              {product.platform}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((product.wishlistCount / (data.mostWishlistedProducts[0]?.wishlistCount || 1)) * 100, 100)}
                              sx={{ width: '40%', height: 4, borderRadius: 2 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  No wishlist data available yet
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Wishlist Insights - Enhanced Design */}
          <Grid item xs={12} lg={6}>
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Wishlist Insights
                </Typography>
                <WishlistInsightsHelp />
              </Box>
              
              <Box display="flex" flexDirection="column" gap={2}>
                {/* Interest Level Card */}
                <Box
                  sx={{
                    p: 2.5,
                    background: `linear-gradient(135deg, ${theme.palette.success.light}15, ${theme.palette.success.light}08)`,
                    border: `3px solid ${theme.palette.success.main}`,
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: `0 4px 12px ${theme.palette.success.main}20`
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: theme.palette.success.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <TrendingUpOutlined sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight="bold" color="success.main">
                      Interest Level
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" fontWeight="medium">
                    {data.totalWishlistAdditions > 50 
                      ? "🚀 High customer interest in your products" 
                      : data.totalWishlistAdditions > 20
                      ? "📈 Moderate customer interest"
                      : "🌱 Building customer interest"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {data.totalWishlistAdditions > 50 
                      ? "Strong market demand - capitalize on this momentum" 
                      : data.totalWishlistAdditions > 20
                      ? "Growing customer base with good potential"
                      : "Early stage - focus on marketing and visibility"}
                  </Typography>
                </Box>

                {/* Conversion Performance Card */}
                <Box
                  sx={{
                    p: 2.5,
                    background: `linear-gradient(135deg, ${getConversionColor(data.wishlistConversionRate)}15, ${getConversionColor(data.wishlistConversionRate)}08)`,
                    border: `2px solid ${getConversionColor(data.wishlistConversionRate)}30`,
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: getConversionColor(data.wishlistConversionRate),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <ShoppingCartOutlined sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: getConversionColor(data.wishlistConversionRate) }}>
                      Conversion Performance
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" fontWeight="medium">
                    {data.wishlistConversionRate >= 15
                      ? "🎯 Excellent conversion from wishlist to purchase"
                      : data.wishlistConversionRate >= 10
                      ? "👍 Good conversion rate, room for improvement"
                      : "💡 Consider strategies to convert wishlist interest"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {data.wishlistConversionRate >= 15
                      ? "Outstanding performance - maintain current strategies"
                      : data.wishlistConversionRate >= 10
                      ? "Solid foundation - optimize with targeted promotions"
                      : "Try exclusive discounts, follow-up emails, or urgency tactics"}
                  </Typography>
                </Box>

                {/* Customer Retention Card */}
                <Box
                  sx={{
                    p: 2.5,
                    background: `linear-gradient(135deg, ${getAbandonmentColor(data.wishlistAbandonmentRate)}15, ${getAbandonmentColor(data.wishlistAbandonmentRate)}08)`,
                    border: `2px solid ${getAbandonmentColor(data.wishlistAbandonmentRate)}30`,
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: getAbandonmentColor(data.wishlistAbandonmentRate),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FavoriteOutlined sx={{ color: 'white', fontSize: 18 }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ color: getAbandonmentColor(data.wishlistAbandonmentRate) }}>
                      Customer Retention
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.primary" fontWeight="medium">
                    {data.wishlistAbandonmentRate <= 20
                      ? "⭐ Great wishlist retention"
                      : data.wishlistAbandonmentRate <= 40
                      ? "📊 Average retention, consider engagement strategies"
                      : "⚠️ High abandonment, review product appeal"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {data.wishlistAbandonmentRate <= 20
                      ? "Customers love keeping your products wishlisted"
                      : data.wishlistAbandonmentRate <= 40
                      ? "Some customers remove items - try engagement campaigns"
                      : "Review pricing, product descriptions, and market positioning"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

export default WishlistAnalytics;