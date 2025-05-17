import { FC, useState, useContext, useEffect, useCallback } from 'react';
import { Card } from '@mui/material';
import AddTwoToneIcon from '@mui/icons-material/AddTwoTone';

import CreateListingModal from './CreateListingModal';
import { ListingsContext } from './context/ListingsContext';
import { getCategories } from 'src/services/api/listings';

// Import refactored components
import {
  ResponsiveActionsBox,
  FilterPanel,
  ActiveFilters,
  ListingsHeader,
  ToastContainer,
  showSuccessToast,
  showErrorToast,
  FilterValues,
  ActiveFilterDisplay,
  ListingsActionsProps
} from './components/ListingsActions';

const ListingsActions: FC<ListingsActionsProps> = ({
  selected,
  setSelected
}) => {
  const { refreshListings, addNewListing, setFilters } = useContext(ListingsContext);
  const [categories, setCategories] = useState<any[]>([]);
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [platform, setPlatform] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilterDisplay>({});
  const [categoriesLoaded, setCategoriesLoaded] = useState<boolean>(false);

  // Fetch categories and platforms from API - but only when needed
  const fetchCategories = useCallback(async () => {
    if (categoriesLoaded) return; // Skip if already loaded

    const data = await getCategories();
    if (data && data.success && Array.isArray(data.data)) {
      setCategories(data.data);
      const allPlatforms = data.data.flatMap((cat) => cat.platforms.filter((p) => p.isActive));
      setPlatforms(allPlatforms);
      setCategoriesLoaded(true);
    } else {
      setCategories([]);
      setPlatforms([]);
    }
  }, [categoriesLoaded]);

  // Only fetch categories when filters are shown or modal is opened
  useEffect(() => {
    if (showFilters || openModal) {
      fetchCategories();
    }
  }, [showFilters, openModal, fetchCategories]);

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

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleApplyFilters = () => {
    // Format dates for display and API
    let startDateISO = startDate ? startDate.toISOString() : undefined;
    let endDateISO = endDate ? endDate.toISOString() : undefined;

    // For display, format as YYYY-MM-DD
    const formatDateForDisplay = (date: Date | null) => {
      if (!date) return '';
      return date.toISOString().split('T')[0];
    };

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

    // Update the active filters display
    const newActiveFilters: ActiveFilterDisplay = {};

    if (category !== 'all') {
      const selectedCat = categories.find(c => c._id === category);
      newActiveFilters.category = selectedCat ? selectedCat.name : category;
    }

    if (platform !== 'all') {
      const selectedPlat = platforms.find(p => p.slug === platform);
      newActiveFilters.platform = selectedPlat ? selectedPlat.name : platform;
    }

    if (status !== 'all') {
      newActiveFilters.status = status.charAt(0).toUpperCase() + status.slice(1);
    }

    if (searchTerm) {
      newActiveFilters.title = searchTerm;
    }

    if (minPrice) {
      newActiveFilters.minPrice = `$${minPrice}`;
    }

    if (maxPrice) {
      newActiveFilters.maxPrice = `$${maxPrice}`;
    }

    if (startDate) {
      newActiveFilters.startDate = formatDateForDisplay(startDate);
    }

    if (endDate) {
      newActiveFilters.endDate = formatDateForDisplay(endDate);
    }

    setActiveFilters(newActiveFilters);
    setFilters(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    // Reset all filter values
    setCategory('all');
    setPlatform('all');
    setStatus('all');
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setStartDate(null);
    setEndDate(null);

    // Clear active filters display
    setActiveFilters({});

    // Reset context filters
    setFilters({});

    // Hide filter panel
    setShowFilters(false);
  };

  const handleRemoveFilter = (key: string) => {
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
        setStartDate(null);
        break;
      case 'endDate':
        setEndDate(null);
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
    if (startDate && key !== 'startDate') updatedFilters.startDate = startDate.toISOString();
    if (endDate && key !== 'endDate') updatedFilters.endDate = endDate.toISOString();

    // Update the context filters in a single operation
    setFilters(updatedFilters);
  };

  const handleCreateListing = async (response) => {
    try {
      console.log('Create listing response received:', response);

      if (response && response.success) {
        setOpenModal(false);
        // Toast is now shown directly in the form submission handler
        // No need to call showSuccessToast here to avoid duplicate notifications

        console.log('Calling addNewListing with response:', response);
        // Pass the entire response to addNewListing
        // The backend returns data with externalId directly
        addNewListing(response);
      } else {
        console.error('Failed to create listing:', response);
        showErrorToast(response.message || 'Failed to create listing. Please try again.');
      }
    } catch (error) {
      console.error('Error handling create listing response:', error);
      showErrorToast('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <Card>
      <ResponsiveActionsBox p={3}>
        <ListingsHeader
          activeFiltersCount={Object.keys(activeFilters).length}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />

        <ActiveFilters
          activeFilters={activeFilters}
          handleRemoveFilter={handleRemoveFilter}
          handleClearFilters={handleClearFilters}
        />

        <FilterPanel
          showFilters={showFilters}
          searchTerm={searchTerm}
          category={category}
          platform={platform}
          status={status}
          minPrice={minPrice}
          maxPrice={maxPrice}
          startDate={startDate}
          endDate={endDate}
          categories={categories}
          platforms={platforms}
          handleSearchChange={handleSearchChange}
          handleCategoryChange={handleCategoryChange}
          handlePlatformChange={handlePlatformChange}
          handleStatusChange={handleStatusChange}
          handleMinPriceChange={handleMinPriceChange}
          handleMaxPriceChange={handleMaxPriceChange}
          handleStartDateChange={handleStartDateChange}
          handleEndDateChange={handleEndDateChange}
          handleApplyFilters={handleApplyFilters}
          setSearchTerm={setSearchTerm}
        />
      </ResponsiveActionsBox>

      {/* Create Listing Modal */}
      <CreateListingModal
        open={openModal}
        onClose={handleCloseModal}
        onSubmit={handleCreateListing}
        initialCategories={categories}
      />
      <ToastContainer />
    </Card>
  );
};

export default ListingsActions;