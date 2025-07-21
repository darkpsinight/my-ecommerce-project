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
  Alert
} from '@mui/material';
import {
  Public,
  People,
  ShoppingCart,
  AttachMoney,
  Star,
  TrendingUp
} from '@mui/icons-material';

interface CustomerMarketPenetrationData {
  country: string;
  countryCode: string;
  customerCount: number;
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  coordinates: {
    lat: number | null;
    lng: number | null;
  };
}

interface CustomerMarketPenetrationProps {
  data: CustomerMarketPenetrationData[];
  loading: boolean;
}

function CustomerMarketPenetration({ data, loading }: CustomerMarketPenetrationProps) {
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

  const getPenetrationLevel = (customerCount: number, totalSales: number) => {
    if (customerCount >= 50 && totalSales >= 100) return { level: 'High', color: 'success' as const };
    if (customerCount >= 20 && totalSales >= 50) return { level: 'Medium', color: 'warning' as const };
    if (customerCount >= 5 && totalSales >= 10) return { level: 'Growing', color: 'info' as const };
    return { level: 'Emerging', color: 'secondary' as const };
  };

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

  if (!data.length) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              <Public color="primary" />
              <Typography variant="h6">Customer Market Penetration</Typography>
            </Box>
          }
          subheader="No customer market data available yet"
        />
        <CardContent>
          <Alert severity="info">
            <Typography variant="body2">
              Your customer market penetration data will appear here once you have customers from different countries.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const sortedMarkets = [...data].sort((a, b) => b.totalSales - a.totalSales);
  const totalCustomers = data.reduce((sum, market) => sum + market.customerCount, 0);
  const totalGlobalSales = data.reduce((sum, market) => sum + market.totalSales, 0);
  const totalGlobalRevenue = data.reduce((sum, market) => sum + market.totalRevenue, 0);

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Public color="primary" />
            <Typography variant="h6">Customer Market Penetration</Typography>
          </Box>
        }
        subheader="Your customer presence across global markets"
      />
      <CardContent>
        {/* Global Summary */}
        <Box mb={3} p={2} bgcolor="background.default" borderRadius={2}>
          <Typography variant="subtitle2" gutterBottom color="primary">
            🌍 Global Customer Presence
          </Typography>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Active Markets: <strong>{data.length} countries</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Customers: <strong>{totalCustomers.toLocaleString()}</strong>
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Global Sales: <strong>{totalGlobalSales.toLocaleString()}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Global Revenue: <strong>${totalGlobalRevenue.toLocaleString()}</strong>
            </Typography>
          </Box>
        </Box>

        {/* Market Penetration List */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
            <Star color="warning" />
            Market Penetration by Country
          </Typography>
          
          <List dense>
            {sortedMarkets.map((market, index) => {
              const penetration = getPenetrationLevel(market.customerCount, market.totalSales);
              const marketShare = totalGlobalSales > 0 ? (market.totalSales / totalGlobalSales) * 100 : 0;
              const customerShare = totalCustomers > 0 ? (market.customerCount / totalCustomers) * 100 : 0;
              
              return (
                <ListItem key={market.country} sx={{ px: 0, py: 1 }}>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="h5">
                            {getCountryFlag(market.countryCode)}
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {market.country}
                          </Typography>
                          {index === 0 && (
                            <Chip label="Top Market" size="small" color="primary" />
                          )}
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={penetration.level}
                            size="small"
                            color={penetration.color}
                          />
                          <Chip
                            label={`${marketShare.toFixed(1)}% share`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        {/* Key Metrics */}
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="caption" color="text.secondary">
                            <People sx={{ fontSize: 14, mr: 0.5 }} />
                            {market.customerCount} customers ({customerShare.toFixed(1)}%)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <ShoppingCart sx={{ fontSize: 14, mr: 0.5 }} />
                            {market.totalSales.toLocaleString()} sales
                          </Typography>
                        </Box>
                        
                        <Box display="flex" justifyContent="space-between" mb={1}>
                          <Typography variant="caption" color="text.secondary">
                            <AttachMoney sx={{ fontSize: 14, mr: 0.5 }} />
                            ${market.totalRevenue.toLocaleString()} revenue
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Avg Order: ${market.avgOrderValue.toFixed(2)}
                          </Typography>
                        </Box>

                        {/* Market Share Progress */}
                        <LinearProgress
                          variant="determinate"
                          value={marketShare}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            '& .MuiLinearProgress-bar': {
                              bgcolor: penetration.color === 'success' ? theme.palette.success.main :
                                      penetration.color === 'warning' ? theme.palette.warning.main :
                                      penetration.color === 'info' ? theme.palette.info.main :
                                      theme.palette.secondary.main
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          Market Share: {marketShare.toFixed(1)}% • {market.totalOrders} orders
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Market Penetration Insights */}
        <Box>
          <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center" gap={1}>
            <TrendingUp color="success" />
            Market Penetration Insights
          </Typography>
          
          <Box display="flex" flexDirection="column" gap={1}>
            {/* Strongest market */}
            {sortedMarkets.length > 0 && (
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>🏆 Strongest Market:</strong> {getCountryFlag(sortedMarkets[0].countryCode)} {sortedMarkets[0].country} with {sortedMarkets[0].customerCount} customers and ${sortedMarkets[0].totalRevenue.toLocaleString()} revenue
                </Typography>
              </Alert>
            )}

            {/* Market diversity */}
            <Alert severity="info">
              <Typography variant="body2">
                <strong>🌍 Global Reach:</strong> You have customers in {data.length} countries with an average of {(totalCustomers / data.length).toFixed(1)} customers per market
              </Typography>
            </Alert>

            {/* Growth opportunities */}
            {(() => {
              const emergingMarkets = sortedMarkets.filter(m => 
                getPenetrationLevel(m.customerCount, m.totalSales).level === 'Emerging'
              );
              
              if (emergingMarkets.length > 0) {
                return (
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>📈 Growth Opportunity:</strong> {emergingMarkets.length} emerging markets ({emergingMarkets.slice(0, 3).map(m => `${getCountryFlag(m.countryCode)} ${m.country}`).join(', ')}) show potential for expansion
                    </Typography>
                  </Alert>
                );
              }
              return null;
            })()}

            {/* High-value markets */}
            {(() => {
              const highValueMarkets = sortedMarkets.filter(m => m.avgOrderValue > 50);
              
              if (highValueMarkets.length > 0) {
                return (
                  <Alert severity="success">
                    <Typography variant="body2">
                      <strong>💎 High-Value Markets:</strong> {highValueMarkets.length} markets have avg order values above $50 - focus on these for premium products
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

export default CustomerMarketPenetration;