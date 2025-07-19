import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Skeleton,
  Grid,
  LinearProgress,
  Chip,
  Alert
} from '@mui/material';
import {
  Inventory,
  CheckCircle,
  Warning,
  Error,
  Pause
} from '@mui/icons-material';
import { InventoryData } from 'src/services/api/analytics';

interface InventoryStatsProps {
  data?: InventoryData;
  loading: boolean;
}

function InventoryStats({ data, loading }: InventoryStatsProps) {
  const getStatusIcon = (status: string) => {
    if (!status) return <Inventory color="disabled" />;
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle color="success" />;
      case 'sold':
        return <CheckCircle color="primary" />;
      case 'expired':
        return <Warning color="warning" />;
      case 'suspended':
        return <Pause color="info" />;
      case 'draft':
        return <Error color="disabled" />;
      default:
        return <Inventory color="disabled" />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'primary' | 'warning' | 'info' | 'secondary' => {
    if (!status) return 'secondary';
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'sold':
        return 'primary';
      case 'expired':
        return 'warning';
      case 'suspended':
        return 'info';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Inventory Statistics" />
        <CardContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} height={60} />
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const inventoryStats = data?.inventoryStats || [];
  const totalListings = inventoryStats.reduce((sum, stat) => sum + stat.count, 0);
  const totalCodes = inventoryStats.reduce((sum, stat) => sum + stat.totalCodes, 0);
  const totalActiveCodes = inventoryStats.reduce((sum, stat) => sum + stat.activeCodes, 0);

  // Calculate health metrics
  const activeListings = inventoryStats.find(stat => stat.status === 'active')?.count || 0;
  const soldListings = inventoryStats.find(stat => stat.status === 'sold')?.count || 0;
  const expiredListings = inventoryStats.find(stat => stat.status === 'expired')?.count || 0;
  
  const healthScore = totalListings > 0 ? ((activeListings / totalListings) * 100) : 0;
  const codeUtilization = totalCodes > 0 ? (((totalCodes - totalActiveCodes) / totalCodes) * 100) : 0;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title="Inventory Statistics"
        subheader="Listings and codes overview"
        avatar={<Inventory color="primary" />}
      />
      <CardContent>
        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={1}>
              <Typography variant="h4" color="primary">
                {totalListings}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Total Listings
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box textAlign="center" p={2} bgcolor="background.default" borderRadius={1}>
              <Typography variant="h4" color="secondary">
                {totalActiveCodes.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Available Codes
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Health Metrics */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Inventory Health
          </Typography>
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">Active Listings</Typography>
              <Typography variant="body2" color="primary">
                {healthScore.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={healthScore}
              color={healthScore > 70 ? 'success' : healthScore > 40 ? 'warning' : 'error'}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">Code Utilization</Typography>
              <Typography variant="body2" color="secondary">
                {codeUtilization.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={codeUtilization}
              color="secondary"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Box>

        {/* Status Breakdown */}
        <Typography variant="subtitle2" gutterBottom>
          Listing Status Breakdown
        </Typography>
        
        {inventoryStats.length > 0 ? (
          <Box>
            {inventoryStats.map((stat) => {
              const percentage = totalListings > 0 ? ((stat.count / totalListings) * 100) : 0;
              
              return (
                <Box key={stat.status} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(stat.status)}
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {stat.status}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {stat.count}
                      </Typography>
                      <Chip 
                        label={`${percentage.toFixed(1)}%`}
                        size="small"
                        color={getStatusColor(stat.status)}
                      />
                    </Box>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption" color="textSecondary">
                      Total Codes: {stat.totalCodes.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Active: {stat.activeCodes.toLocaleString()}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={percentage}
                    color={getStatusColor(stat.status)}
                    sx={{ height: 4, borderRadius: 2 }}
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
          >
            <Typography variant="body2">
              No inventory data available
            </Typography>
          </Box>
        )}

        {/* Alerts */}
        {expiredListings > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            You have {expiredListings} expired listing{expiredListings > 1 ? 's' : ''} that need attention.
          </Alert>
        )}
        
        {totalActiveCodes < 10 && totalActiveCodes > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Low inventory: Only {totalActiveCodes} codes remaining across all listings.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default InventoryStats;