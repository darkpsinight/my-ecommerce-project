import { FC, useState } from 'react';
import {
  Button,
  Card,
  Grid,
  Box,
  Typography,
  useTheme,
  styled,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';

import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import FilterListTwoToneIcon from '@mui/icons-material/FilterListTwoTone';

import CreateListingModal from './CreateListingModal';

interface ListingsActionsProps {
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}

const ListingsActions: FC<ListingsActionsProps> = ({
  selected,
  setSelected
}) => {
  const theme = useTheme();
  const [platform, setPlatform] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handlePlatformChange = (event) => {
    setPlatform(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleCreateListing = async (response) => {
    try {
      if (response && response.success) {
        setOpenModal(false);
        setAlert({
          open: true,
          message: response.message || 'Listing created successfully!',
          severity: 'success'
        });

        // Refresh the listings table (will be implemented in step 4)
        // refreshListings();
      } else {
        setAlert({
          open: true,
          message:
            response.message || 'Failed to create listing. Please try again.',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error handling create listing response:', error);
      setAlert({
        open: true,
        message: 'An unexpected error occurred. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseAlert = () => {
    setAlert({
      ...alert,
      open: false
    });
  };

  const ButtonSearch = styled(Button)(
    ({ theme }) => `
      margin-right: ${theme.spacing(1)};
    `
  );

  const ButtonAdd = styled(Button)(
    ({ theme }) => `
      margin-right: ${theme.spacing(1)};
      background-color: ${theme.colors.primary.main};
      color: ${theme.colors.alpha.white[100]};
      
      &:hover {
        background-color: ${theme.colors.primary.dark};
      }
    `
  );

  return (
    <Card>
      <Box p={3}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4" gutterBottom>
              Product Listings
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Overview of your listing activity
            </Typography>
          </Grid>
          <Grid item>
            <ButtonAdd
              variant="contained"
              startIcon={<AddTwoToneIcon />}
              onClick={handleOpenModal}
            >
              Create New Listing
            </ButtonAdd>
          </Grid>
        </Grid>
        <Divider sx={{ mt: 3, mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchTwoToneIcon />
                  </InputAdornment>
                )
              }}
              placeholder="Search by title, code, or platform..."
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Platform</InputLabel>
              <Select
                value={platform}
                onChange={handlePlatformChange}
                label="Platform"
              >
                <MenuItem value="all">All Platforms</MenuItem>
                <MenuItem value="steam">Steam</MenuItem>
                <MenuItem value="epic">Epic Games</MenuItem>
                <MenuItem value="playstation">PlayStation</MenuItem>
                <MenuItem value="xbox">Xbox</MenuItem>
                <MenuItem value="nintendo">Nintendo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <ButtonSearch
              fullWidth
              startIcon={<FilterListTwoToneIcon />}
              variant="outlined"
            >
              Filter
            </ButtonSearch>
          </Grid>
        </Grid>
      </Box>

      {/* Create Listing Modal */}
      <CreateListingModal
        open={openModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateListing}
      />

      {/* Feedback Alert */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity === 'success' ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default ListingsActions;
