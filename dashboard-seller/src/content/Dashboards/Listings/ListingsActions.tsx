import { FC, useState, useContext, useEffect } from 'react';
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
  Collapse,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';

// Define interfaces for type safety
interface FilterValues {
  category?: string;
  platform?: string;
  status?: string;
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

interface ActiveFilterDisplay {
  category?: string;
  platform?: string;
  status?: string;
  title?: string;
  minPrice?: string;
  maxPrice?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: string | undefined;
}

import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import FilterListTwoToneIcon from '@mui/icons-material/FilterListTwoTone';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ClearIcon from '@mui/icons-material/Clear';

import CreateListingModal from './CreateListingModal';
import { ListingsContext } from './context/ListingsContext';
import toast, { Toaster } from 'react-hot-toast';
import LargerDismissibleToast from 'src/components/LargerDismissibleToast';
import { getCategories } from 'src/services/api/listings';

interface ListingsActionsProps {
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}

// ---- Styled components ----
const ButtonSearch = styled(Button)(
  ({ theme }) => `
    margin-right: ${theme.spacing(1)};
  `
);

const ListingsHeaderBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: theme.spacing(2.5)
  }
}));

const ResponsiveActionsBox = styled(Box)(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    '.MuiButton-root': {
      width: '100%',
      marginRight: 0,
      marginBottom: theme.spacing(1.5)
    }
  }
}));

const ActiveFilterChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  '& .MuiChip-label': {
    fontWeight: 500
  }
}));

// Create a component for the bold filter label
const BoldSpan = styled('span')({
  fontWeight: 700
});

const FilterToggleButton = styled(Button)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: 'auto',
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2)
}));

const ListingsActions: FC<ListingsActionsProps> = ({
  selected,
  setSelected
}) => {
  const theme = useTheme();
  const { refreshListings, addNewListing, fetchListings, setFilters, filters, limit } = useContext(ListingsContext);
  const [categories, setCategories] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [platform, setPlatform] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilterDisplay>({});

  useEffect(() => {
    // Fetch categories and platforms from API
    const fetchCategories = async () => {
      const data = await getCategories();
      if (data && data.success && Array.isArray(data.data)) {
        setCategories(data.data);
        const allPlatforms = data.data.flatMap((cat) => cat.platforms.filter((p) => p.isActive));
        setPlatforms(allPlatforms);
      } else {
        setCategories([]);
        setPlatforms([]);
      }
    };
    fetchCategories();
  }, []);

  // Update platforms when category changes
  useEffect(() => {
    if (category === 'all') {
      const allPlatforms = categories.flatMap((cat) => cat.platforms.filter((p) => p.isActive));
      setPlatforms(allPlatforms);
    } else {
      const selectedCat = categories.find((cat) => cat._id === category);
      setPlatforms(selectedCat ? selectedCat.platforms.filter((p) => p.isActive) : []);
    }
    setPlatform('all'); // Reset platform selection when category changes
  }, [category, categories]);

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };

  const handlePlatformChange = (event) => {
    setPlatform(event.target.value);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleMinPriceChange = (event) => {
    setMinPrice(event.target.value.replace(/[^\d.]/g, ''));
  };

  const handleMaxPriceChange = (event) => {
    setMaxPrice(event.target.value.replace(/[^\d.]/g, ''));
  };

  const handleStartDateChange = (event) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event) => {
    setEndDate(event.target.value);
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleApplyFilters = () => {
    // Convert date to ISO string if present
    let startDateISO = startDate ? `${startDate}T00:00:00.000Z` : undefined;
    let endDateISO = endDate ? `${endDate}T23:59:59.999Z` : undefined;
    
    const filters = {
      category: category !== 'all' ? category : undefined,
      platform: platform !== 'all' ? platform : undefined,
      status: status !== 'all' ? status : undefined,
      title: searchTerm || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      startDate: startDateISO,
      endDate: endDateISO
    };
    
    // Update active filters for UI display
    const newActiveFilters: ActiveFilterDisplay = {};
    
    if (category !== 'all') {
      const categoryName = categories.find(cat => cat._id === category)?.name || category;
      newActiveFilters.category = `Category: ${categoryName}`;
    }
    
    if (platform !== 'all') {
      newActiveFilters.platform = `Platform: ${platform}`;
    }
    
    if (status !== 'all') {
      newActiveFilters.status = `Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    }
    
    if (searchTerm) {
      newActiveFilters.title = `Title: ${searchTerm}`;
    }
    
    if (minPrice) {
      newActiveFilters.minPrice = `Min: ${minPrice}`;
    }
    
    if (maxPrice) {
      newActiveFilters.maxPrice = `Max: ${maxPrice}`;
    }
    
    if (startDate) {
      newActiveFilters.startDate = `From: ${startDate}`;
    }
    
    if (endDate) {
      newActiveFilters.endDate = `To: ${endDate}`;
    }
    
    setActiveFilters(newActiveFilters);
    setFilters(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setCategory('all');
    setPlatform('all');
    setStatus('all');
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setStartDate('');
    setEndDate('');
    setActiveFilters({});
    setFilters({
      category: undefined,
      platform: undefined,
      status: undefined,
      title: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      startDate: undefined,
      endDate: undefined
    });
  };

  const handleRemoveFilter = (key) => {
    // Update the UI state first
    const newActiveFilters = { ...activeFilters };
    delete newActiveFilters[key];
    setActiveFilters(newActiveFilters);
    
    // Update the local state based on which filter was removed
    switch(key) {
      case 'category':
        setCategory('all');
        break;
      case 'platform':
        setPlatform('all');
        break;
      case 'status':
        setStatus('all');
        break;
      case 'title':
        setSearchTerm('');
        break;
      case 'minPrice':
        setMinPrice('');
        break;
      case 'maxPrice':
        setMaxPrice('');
        break;
      case 'startDate':
        setStartDate('');
        break;
      case 'endDate':
        setEndDate('');
        break;
    }
    
    // Instead of using fetchListings which would trigger the useEffect,
    // directly call the API with the updated filters
    // This avoids the double API call issue
    const updatedFilters: Partial<FilterValues> = {};
    
    // Only include filters that are active
    if (category !== 'all' && key !== 'category') updatedFilters.category = category;
    if (platform !== 'all' && key !== 'platform') updatedFilters.platform = platform;
    if (status !== 'all' && key !== 'status') updatedFilters.status = status;
    if (searchTerm && key !== 'title') updatedFilters.title = searchTerm;
    if (minPrice && key !== 'minPrice') updatedFilters.minPrice = Number(minPrice);
    if (maxPrice && key !== 'maxPrice') updatedFilters.maxPrice = Number(maxPrice);
    if (startDate && key !== 'startDate') updatedFilters.startDate = `${startDate}T00:00:00.000Z`;
    if (endDate && key !== 'endDate') updatedFilters.endDate = `${endDate}T23:59:59.999Z`;
    
    // Update the context filters in a single operation
    setFilters(updatedFilters);
  };

  const handleCreateListing = async (response) => {
    try {
      if (response && response.success) {
        setOpenModal(false);
        toast.custom(
          (t) => (
            <LargerDismissibleToast
              t={t}
              message={response.message || 'Listing created successfully!'}
              type="success"
            />
          ),
          { duration: 10000 }
        );
        // Add the new listing to the table and refresh
        if (response.data && response.data.listing) {
          addNewListing(response.data.listing);
        } else {
          refreshListings();
        }
      } else {
        toast.custom(
          (t) => (
            <LargerDismissibleToast
              t={t}
              message={
                response.message ||
                'Failed to create listing. Please try again.'
              }
              type="error"
            />
          ),
          { duration: 10000 }
        );
      }
    } catch (error) {
      console.error('Error handling create listing response:', error);
      toast.custom(
        (t) => (
          <LargerDismissibleToast
            t={t}
            message={'An unexpected error occurred. Please try again.'}
            type="error"
          />
        ),
        { duration: 10000 }
      );
    }
  };

  return (
    <Card>
      <ResponsiveActionsBox p={3}>
        <Grid container spacing={3} alignItems="center" justifyContent="space-between">
          <Grid item xs={12} md={8}>
            <ListingsHeaderBox>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  mb: 0.5,
                  letterSpacing: '-0.5px'
                }}
              >
                Product Listings
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{
                  fontWeight: 400,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                {Object.keys(activeFilters).length > 0 
                  ? `${Object.keys(activeFilters).length} active filters` 
                  : 'Manage and filter your listings'}
              </Typography>
            </ListingsHeaderBox>
          </Grid>
          <Grid item xs={12} md={4} container justifyContent="flex-end" sx={{ width: '100%' }}>
            <Box sx={{ width: '100%', maxWidth: { md: 180 } }}>
              <FilterToggleButton
                fullWidth
                sx={{ minWidth: { md: 180 } }}
                color="secondary"
                variant="outlined"
                onClick={() => setShowFilters(!showFilters)}
                endIcon={showFilters ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                startIcon={<FilterListTwoToneIcon />}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </FilterToggleButton>
            </Box>
          </Grid>
        </Grid>

        {/* Active Filters Display */}
        {Object.keys(activeFilters).length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
            {Object.entries(activeFilters).map(([key, value]) => {
              // For each filter chip, parse the label to make the prefix bold
              const parts = value.split(':');
              const label = parts.length > 1 ? (
                <>
                  <BoldSpan>{parts[0]}:</BoldSpan>{parts.slice(1).join(':')}
                </>
              ) : value;
              
              return (
                <ActiveFilterChip
                  key={key}
                  label={label}
                  onDelete={() => handleRemoveFilter(key)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              );
            })}
            <Button
              size="small"
              variant="text"
              color="error"
              sx={{ ml: 1 }}
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
          </Box>
        )}

        {/* Collapsible Filter Panel */}
        <Collapse in={showFilters}>
          <Divider sx={{ mt: 1, mb: 3 }} />
          <Grid container spacing={3}>
            {/* Search field moved inside the filter panel */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchTwoToneIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton 
                        size="small" 
                        onClick={() => setSearchTerm('')}
                        edge="end"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                placeholder="Search by title..."
                label="Title"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={handleCategoryChange}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat._id} value={cat._id}>
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" disabled={platforms.length === 0} size="small">
                <InputLabel>Platform</InputLabel>
                <Select
                  value={platform}
                  onChange={handlePlatformChange}
                  label="Platform"
                >
                  <MenuItem value="all">All Platforms</MenuItem>
                  {platforms.map((plat) => (
                    <MenuItem key={plat.name} value={plat.name}>
                      {plat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={status}
                  onChange={handleStatusChange}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="sold">Sold</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={minPrice}
                onChange={handleMinPriceChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  )
                }}
                placeholder="Min Price"
                label="Min Price"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={maxPrice}
                onChange={handleMaxPriceChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">$</InputAdornment>
                  )
                }}
                placeholder="Max Price"
                label="Max Price"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                InputLabelProps={{ shrink: true }}
                label="Start Date"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                InputLabelProps={{ shrink: true }}
                label="End Date"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ButtonSearch
                fullWidth
                startIcon={<FilterListTwoToneIcon />}
                variant="contained"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </ButtonSearch>
            </Grid>
          </Grid>
          <Divider sx={{ mt: 3, mb: 1 }} />
        </Collapse>
      </ResponsiveActionsBox>

      {/* Create Listing Modal */}
      <CreateListingModal
        open={openModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateListing}
      />
      <Toaster position="top-right" />
    </Card>
  );
};

export default ListingsActions;