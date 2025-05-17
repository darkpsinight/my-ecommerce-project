import { FC, useState, useEffect, useContext } from 'react';
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
  Alert,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';

import ShoppingCartTwoToneIcon from '@mui/icons-material/ShoppingCartTwoTone';
import AttachMoneyTwoToneIcon from '@mui/icons-material/AttachMoneyTwoTone';
import LocalShippingTwoToneIcon from '@mui/icons-material/LocalShippingTwoTone';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import RefreshTwoToneIcon from '@mui/icons-material/RefreshTwoTone';
import CreateListingModal from './CreateListingModal';
import { ListingsContext } from './context/ListingsContext';
import { useAppDispatch, useAppSelector } from 'src/redux/hooks';
import {
  fetchListingsSummary,
  selectListingsSummary,
  selectListingsSummaryStatus,
  selectListingsSummaryError
} from 'src/redux/slices/listingsSummarySlice';

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

const ButtonAdd = styled(Button)(
  ({ theme }) => `
    background-color: ${theme.colors.primary.main};
    color: ${theme.colors.alpha.white[100]};

    &:hover {
      background-color: ${theme.colors.primary.dark};
    }
  `
);

const ListingsSummary: FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { addNewListing, refreshListings } = useContext(ListingsContext);
  const summaryData = useAppSelector(selectListingsSummary);
  const status = useAppSelector(selectListingsSummaryStatus);
  const error = useAppSelector(selectListingsSummaryError);
  const loading = status === 'loading';
  const [openModal, setOpenModal] = useState<boolean>(false);

  // Listen for changes in the ListingsContext to update summary
  useEffect(() => {
    // Refresh summary data when component mounts
    dispatch(fetchListingsSummary());

    // Set up an effect to refresh summary data whenever listings are refreshed
    const handleListingsRefresh = () => {
      dispatch(fetchListingsSummary());
    };

    // Create a custom event to listen for listings refresh
    window.addEventListener('listingsRefreshed', handleListingsRefresh);

    return () => {
      // Clean up event listener when component unmounts
      window.removeEventListener('listingsRefreshed', handleListingsRefresh);
    };
  }, [dispatch]);

  // Function to manually refresh summary data
  const handleRefresh = () => {
    dispatch(fetchListingsSummary());
  };

  const items = [
    {
      id: 1,
      name: 'On Sale Listings',
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
        <Grid container spacing={3} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={8}>
            <Box display="flex" alignItems="center">
              <Box>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  sx={{
                    mb: 0.5,
                    mt: 0,
                    letterSpacing: '-0.5px'
                  }}
                >
                  Listings Summary
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{
                    fontWeight: 400,
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                    color: (theme) => theme.palette.text.secondary,
                    mb: 0
                  }}
                >
                  Overview of your listing activity
                </Typography>
              </Box>
              <Tooltip title="Refresh summary data">
                <IconButton
                  sx={{ ml: 2 }}
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshTwoToneIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} container justifyContent="flex-end">
            <ButtonAdd
              fullWidth
              startIcon={<AddTwoToneIcon />}
              onClick={() => setOpenModal(true)}
            >
              Create New Listing
            </ButtonAdd>
          </Grid>
        </Grid>
      </Box>
      <Divider />
      {error && (
        <Box sx={{ p: 2 }}>
          <Alert
            severity="error"
            sx={{ width: '100%' }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      )}
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {loading
            ? // Loading skeleton state
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
            : // Actual data display
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
                      <Typography variant="h3">{item.value}</Typography>
                    </Box>
                  </SummaryCard>
                </Grid>
              ))}
        </Grid>
      </Box>
      <CreateListingModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSubmit={addNewListing}
      />
    </Card>
  );
};

export default ListingsSummary;
