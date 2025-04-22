import { FC, useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Divider,
  Grid,
  Paper,
  Avatar,
  useTheme,
  styled,
  Skeleton,
  Alert
} from '@mui/material';

import ShoppingCartTwoToneIcon from '@mui/icons-material/ShoppingCartTwoTone';
import AttachMoneyTwoToneIcon from '@mui/icons-material/AttachMoneyTwoTone';
import LocalShippingTwoToneIcon from '@mui/icons-material/LocalShippingTwoTone';
import { getListingsSummary } from 'src/services/api/listings';

const SummaryCard = styled(Paper)(
  ({ theme }) => `
    padding: ${theme.spacing(2)};
    border-radius: ${theme.shape.borderRadius}px;
    display: flex;
    align-items: center;
    background: ${theme.palette.background.paper};
    height: 100%;
    position: relative;
    transition: all .2s;
    
    &:hover {
      box-shadow: ${theme.shadows[3]};
      transform: translateY(-5px);
    }
`
);

interface SummaryData {
  activeListings: number;
  soldCodes: number;
  totalRevenue: number;
}

const ListingsSummary: FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData>({
    activeListings: 0,
    soldCodes: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getListingsSummary();
        
        if (response && response.success && response.data) {
          setSummaryData({
            activeListings: response.data.activeListings || 0,
            soldCodes: response.data.soldCodes || 0,
            totalRevenue: response.data.totalRevenue || 0
          });
        } else {
          setError(response.message || 'Failed to fetch summary data');
        }
      } catch (error) {
        console.error('Error fetching summary data:', error);
        setError('An error occurred while fetching summary data');
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  const items = [
    {
      id: 1,
      name: 'Active Listings',
      value: summaryData.activeListings.toString(),
      icon: ShoppingCartTwoToneIcon,
      color: theme.colors.primary.main
    },
    {
      id: 2,
      name: 'Total Revenue',
      value: `$${summaryData.totalRevenue.toFixed(2)}`,
      icon: AttachMoneyTwoToneIcon,
      color: theme.colors.success.main
    },
    {
      id: 3,
      name: 'Delivered Codes',
      value: summaryData.soldCodes.toString(),
      icon: LocalShippingTwoToneIcon,
      color: theme.colors.warning.main
    }
  ];

  return (
    <Card>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4">Listings Summary</Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Overview of your listing activity
        </Typography>
      </Box>
      <Divider />
      <Box sx={{ p: 3 }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : null}
        
        <Grid container spacing={3}>
          {loading ? (
            // Loading skeleton state
            Array.from(new Array(3)).map((_, index) => (
              <Grid item xs={12} md={4} key={`skeleton-${index}`}>
                <SummaryCard elevation={0}>
                  <Skeleton 
                    variant="circular" 
                    width={54} 
                    height={54} 
                    sx={{ mr: 2 }} 
                  />
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="text" width="60%" height={24} />
                    <Skeleton variant="text" width="40%" height={32} />
                  </Box>
                </SummaryCard>
              </Grid>
            ))
          ) : (
            // Actual data display
            items.map((item) => (
              <Grid item xs={12} md={4} key={item.id}>
                <SummaryCard elevation={0}>
                  <Avatar
                    sx={{
                      mr: 2,
                      width: 54,
                      height: 54,
                      background: item.color,
                      color: `${theme.colors.alpha.white[100]}`
                    }}
                  >
                    <item.icon fontSize="medium" />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" noWrap>
                      {item.name}
                    </Typography>
                    <Typography variant="h3">
                      {item.value}
                    </Typography>
                  </Box>
                </SummaryCard>
              </Grid>
            ))
          )}
        </Grid>
      </Box>
    </Card>
  );
};

export default ListingsSummary;
