import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  LinearProgress
} from '@mui/material';
import { Star, SportsEsports } from '@mui/icons-material';

interface BestSeller {
  _id: string;
  title: string;
  platform: string;
  totalSold: number;
  revenue: number;
}

interface TopProductsProps {
  data?: BestSeller[];
  loading: boolean;
}

function TopProducts({ data, loading }: TopProductsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
        <CardHeader title="Top Products" />
        <CardContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {[1, 2, 3, 4, 5].map((item) => (
              <Skeleton key={item} height={80} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const maxSold = data && data.length > 0 ? Math.max(...data.map(item => item.totalSold)) : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Top Products"
        subheader="Best selling products by quantity"
        avatar={<Star color="warning" />}
      />
      <CardContent>
        {data && data.length > 0 ? (
          <List>
            {data.slice(0, 8).map((product, index) => {
              const progressValue = maxSold > 0 ? (product.totalSold / maxSold) * 100 : 0;
              
              return (
                <ListItem key={product._id} sx={{ px: 0, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar 
                      sx={{ 
                        bgcolor: getPlatformColor(product.platform),
                        width: 40,
                        height: 40
                      }}
                    >
                      <SportsEsports fontSize="small" />
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
                          #{index + 1} {product.title}
                        </Typography>
                        <Chip 
                          label={product.totalSold.toLocaleString()} 
                          size="small"
                          color={index === 0 ? 'primary' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="caption" color="textSecondary">
                            {product.platform}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatCurrency(product.revenue)}
                          </Typography>
                        </Box>
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
            py={8}
            color="text.secondary"
          >
            <Box textAlign="center">
              <SportsEsports sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="body2">
                No product sales data available
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Start selling to see your top products here
              </Typography>
            </Box>
          </Box>
        )}

        {/* Summary Stats */}
        {data && data.length > 0 && (
          <Box mt={2} p={2} bgcolor="background.default" borderRadius={1}>
            <Typography variant="caption" color="textSecondary" display="block">
              Total Products Sold: {data.reduce((sum, product) => sum + product.totalSold, 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              Total Revenue: {formatCurrency(data.reduce((sum, product) => sum + product.revenue, 0))}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default TopProducts;