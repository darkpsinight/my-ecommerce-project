import {
  Card,
  CardHeader,
  CardContent,
  Box,
  useTheme,
  Skeleton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PlatformData {
  _id: string;
  listings: number;
  totalCodes: number;
}

interface PlatformDistributionProps {
  data?: PlatformData[];
  loading: boolean;
}

function PlatformDistribution({ data, loading }: PlatformDistributionProps) {
  const theme = useTheme();

  const getPlatformColors = () => {
    return [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
      theme.palette.info.main,
      '#9c27b0',
      '#ff5722',
      '#607d8b',
      '#795548'
    ];
  };

  const formatChartData = () => {
    if (!data || data.length === 0) return null;

    const colors = getPlatformColors();
    const labels = data.map(item => item._id);
    const listingsData = data.map(item => item.listings);
    const codesData = data.map(item => item.totalCodes);

    return {
      labels,
      datasets: [
        {
          label: 'Listings',
          data: listingsData,
          backgroundColor: colors.slice(0, data.length),
          borderColor: colors.slice(0, data.length).map(color => color),
          borderWidth: 2,
          hoverBorderWidth: 3
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} listings (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%'
  };

  const chartData = formatChartData();
  const totalListings = data?.reduce((sum, platform) => sum + platform.listings, 0) || 0;
  const totalCodes = data?.reduce((sum, platform) => sum + platform.totalCodes, 0) || 0;

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Platform Distribution" />
        <CardContent>
          <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
          <Box mt={2}>
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} height={40} sx={{ mb: 1 }} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Platform Distribution"
        subheader="Listings and codes by platform"
      />
      <CardContent>
        {chartData ? (
          <>
            {/* Chart */}
            <Box sx={{ height: 250, position: 'relative', mb: 3 }}>
              <Doughnut data={chartData} options={chartOptions} />
              {/* Center text */}
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}
              >
                <Typography variant="h4" color="primary">
                  {totalListings}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Total Listings
                </Typography>
              </Box>
            </Box>

            {/* Platform Details */}
            <List dense>
              {data?.map((platform, index) => {
                const percentage = totalListings > 0 
                  ? ((platform.listings / totalListings) * 100).toFixed(1)
                  : '0';
                const colors = getPlatformColors();
                
                return (
                  <ListItem key={platform._id} sx={{ px: 0 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: colors[index % colors.length],
                        mr: 2,
                        flexShrink: 0
                      }}
                    />
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2">
                            {platform._id}
                          </Typography>
                          <Chip 
                            label={`${percentage}%`} 
                            size="small" 
                            color={index === 0 ? 'primary' : 'default'}
                          />
                        </Box>
                      }
                      secondary={
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="caption" color="textSecondary">
                            {platform.listings} listings
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {platform.totalCodes.toLocaleString()} codes
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>

            {/* Summary */}
            <Box mt={2} p={2} bgcolor="background.default" borderRadius={1}>
              <Typography variant="caption" color="textSecondary" display="block">
                Total Platforms: {data?.length || 0}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                Total Codes: {totalCodes.toLocaleString()}
              </Typography>
            </Box>
          </>
        ) : (
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="center" 
            py={8}
            color="text.secondary"
          >
            <Box textAlign="center">
              <Typography variant="body2">
                No platform data available
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Create listings to see platform distribution
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default PlatformDistribution;