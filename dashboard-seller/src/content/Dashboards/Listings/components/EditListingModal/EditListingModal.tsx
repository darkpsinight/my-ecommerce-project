import { FC, useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, Zoom, useTheme, alpha, CircularProgress, Box, Tabs, Tab, Typography } from '@mui/material';
import toast, { Toaster } from 'react-hot-toast';

// Import types
import { Listing } from '../../types';
import { FormData as ListingFormData } from './components/ListingForm/utils/types';

// Import utility functions
import { getActiveCodes, getTotalCodes, getDiscountPercentage } from '../ViewListingDetailsModal/utils/listingHelpers';

// Import components
import ModalHeader from './components/ModalHeader';
import ListingHeader from './components/ListingHeader';
import TabNavigation from '../ViewListingDetailsModal/components/TabNavigation';
import TabPanel from '../ViewListingDetailsModal/components/TabPanel';
import ListingForm from './components/ListingForm';
import ModalFooter from './components/ModalFooter';

// Import API service
import { updateListing, getCategories } from '../../../../../services/api/listings';

// Import icons
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CodeIcon from '@mui/icons-material/Code';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ImageIcon from '@mui/icons-material/Image';

interface EditListingModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string | null;
  listings: Listing[];
  onListingUpdated: (updatedListing: Listing) => void;
}

const EditListingModal: FC<EditListingModalProps> = ({
  open,
  onClose,
  listingId,
  listings,
  onListingUpdated
}) => {
  const theme = useTheme();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [activeCodes, setActiveCodes] = useState(0);
  const [categories, setCategories] = useState([]);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);

  // Shared form state to persist data across tabs
  const [sharedFormData, setSharedFormData] = useState<ListingFormData | null>(null);

  // Create refs to access the ListingForm components
  const generalFormRef = useRef<any>(null);
  const codesFormRef = useRef<any>(null);
  const tagsLanguagesFormRef = useRef<any>(null);
  const imagesFormRef = useRef<any>(null);

  useEffect(() => {
    if (open && listingId) {
      setIsLoading(true);

      // Find the listing in the listings array
      const foundListing = listings.find(item => item.externalId === listingId);

      if (foundListing) {
        setListing(foundListing);
        setActiveCodes(getActiveCodes(foundListing));

        // Initialize shared form data from the listing
        setSharedFormData({
          title: foundListing.title || '',
          description: foundListing.description || '',
          price: foundListing.price ? foundListing.price.toString() : '',
          originalPrice: foundListing.originalPrice ? foundListing.originalPrice.toString() : '',
          platform: foundListing.platform || '',
          region: foundListing.region || '',
          isRegionLocked: foundListing.isRegionLocked || false,
          expirationDate: foundListing.expirationDate ? new Date(foundListing.expirationDate) : null,
          categoryId: foundListing.categoryId || '',
          status: foundListing.status || 'active',
          autoDelivery: foundListing.autoDelivery || false,
          thumbnailUrl: foundListing.thumbnailUrl || '',
          tags: foundListing.tags || [],
          supportedLanguages: foundListing.supportedLanguages || [],
          sellerNotes: foundListing.sellerNotes || '',
          codes: foundListing.codes || [],
          newCode: ''
        });

        // Fetch categories data
        fetchCategories();
      } else {
        console.error('Listing not found:', listingId);
        setTimeout(() => {
          toast.error('Listing not found');
        }, 100);
      }

      setIsLoading(false);
    }
  }, [open, listingId, listings]);

  // Fetch categories data
  const fetchCategories = async () => {
    try {
      const response = await getCategories();

      if (response.success) {
        setCategories(response.data || []);

        // Extract all available platforms from categories
        const platforms = response.data.reduce((acc, category) => {
          if (category.platforms && Array.isArray(category.platforms)) {
            const platformNames = category.platforms
              .filter(platform => platform.isActive)
              .map(platform => platform.name);
            return [...acc, ...platformNames];
          }
          return acc;
        }, []);

        // Remove duplicates and sort alphabetically
        const uniquePlatforms = [...new Set(platforms)].sort();
        setAvailablePlatforms(uniquePlatforms);
      } else {
        console.error('Failed to fetch categories:', response.message);
        setTimeout(() => {
          toast.error(`Failed to load categories: ${response.message || 'Unknown error'}`);
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setTimeout(() => {
        toast.error(`Failed to load categories: ${error.message || 'Network Error'}`);
      }, 100);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // Save the current tab's form data before switching
    const currentFormRef = getCurrentFormRef();

    if (currentFormRef.current?.getFormData && sharedFormData) {
      // Get the current form data
      const currentFormData = currentFormRef.current.getFormDataRaw();

      // Update the shared form data with the current tab's data
      setSharedFormData({
        ...sharedFormData,
        ...currentFormData
      });
    }

    // Switch to the new tab
    setTabValue(newValue);
  };

  const handleCodesChange = (codesCount: number) => {
    // For simplicity, we're assuming all new codes are active
    setActiveCodes(codesCount);
  };

  // Handle status change from the header
  const handleStatusChange = async (newStatus: 'active' | 'draft') => {
    if (!listing) return;

    // Update the local state first for immediate UI feedback
    setListing({
      ...listing,
      status: newStatus
    });

    // Prepare the data for API call
    const apiData = {
      status: newStatus
    };

    setIsSubmitting(true);
    try {
      // Make the API call to update the listing status
      const response = await updateListing(listing.externalId, apiData);

      // Create an updated listing object with the response data and existing data
      const updatedListing = {
        ...listing,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      // Update the listings array in the parent component without closing the modal
      // We're using a custom event to notify the parent component about the update
      // This prevents the modal from closing when the status is updated
      const customEvent = new CustomEvent('listingStatusUpdated', {
        detail: { updatedListing }
      });
      window.dispatchEvent(customEvent);

      setTimeout(() => {
        toast.success(`Listing status updated to ${newStatus}`);
      }, 100);
    } catch (error: any) {
      console.error('Failed to update listing status:', error);

      // Revert the local state if the API call fails
      setListing({
        ...listing,
        status: listing.status // Revert to original status
      });

      const errorMessage = error.response?.data?.message || 'Failed to update listing status. Please try again.';
      setTimeout(() => {
        toast.error(errorMessage);
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the current form ref based on the active tab
  const getCurrentFormRef = () => {
    switch (tabValue) {
      case 0:
        return generalFormRef;
      case 1:
        return codesFormRef;
      case 2:
        return tagsLanguagesFormRef;
      case 3:
        return imagesFormRef;
      default:
        return generalFormRef;
    }
  };

  // Collect form data from all tabs
  const collectFormData = () => {
    const formData: Partial<Listing> = {};

    // Get data from each form if available
    if (generalFormRef.current?.getFormData) {
      Object.assign(formData, generalFormRef.current.getFormData());
    }

    if (codesFormRef.current?.getFormData) {
      Object.assign(formData, codesFormRef.current.getFormData());
    }

    if (tagsLanguagesFormRef.current?.getFormData) {
      Object.assign(formData, tagsLanguagesFormRef.current.getFormData());
    }

    if (imagesFormRef.current?.getFormData) {
      Object.assign(formData, imagesFormRef.current.getFormData());
    }

    return formData;
  };

  const handleSubmit = async (updatedData: Partial<Listing> = {}) => {
    if (!listing) return;

    // Get the current form ref
    const currentFormRef = getCurrentFormRef();

    // Validate the current form
    if (currentFormRef.current?.validateForm) {
      // Directly call validateForm to trigger validation and display errors
      const isValid = currentFormRef.current.validateForm();

      if (!isValid) {
        setTimeout(() => {
          toast.error('Please fix the errors in the form before submitting');
        }, 100);
        return;
      }
    }

    // Collect data from all forms
    const formData = collectFormData();

    // Convert categoryId to string if it's an object
    const apiData: any = { ...formData };
    if (apiData.categoryId && typeof apiData.categoryId === 'object') {
      apiData.categoryId = apiData.categoryId._id;
    }

    setIsSubmitting(true);
    try {
      // Make the API call to update the listing
      const response = await updateListing(listing.externalId, apiData);

      // Create an updated listing object with the response data and existing data
      const updatedListing = {
        ...listing,
        ...formData,
        updatedAt: new Date().toISOString()
      };

      // Call the onListingUpdated callback with the updated listing
      onListingUpdated(updatedListing as Listing);

      setTimeout(() => {
        toast.success('Listing updated successfully');
      }, 100);
      onClose();
    } catch (error: any) {
      console.error('Failed to update listing:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update listing. Please try again.';
      setTimeout(() => {
        toast.error(errorMessage);
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  const totalCodes = listing ? getTotalCodes(listing) : 0;
  const discountPercentage = listing ? getDiscountPercentage(listing) : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="edit-listing-dialog-title"
      TransitionComponent={Zoom}
      transitionDuration={300}
      sx={{
        margin: { xs: '8px', sm: '24px' },
        '& .MuiDialog-paper': {
          borderRadius: { xs: 1, sm: 2 },
          boxShadow: theme.shadows[20],
          overflow: 'hidden',
          maxHeight: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' },
          maxWidth: { xs: 'calc(100% - 16px)', sm: '600px', md: '900px' },
          width: '100%'
        },
        '& .MuiDialog-container': {
          alignItems: { xs: 'flex-start', sm: 'center' },
          paddingTop: { xs: '8px', sm: '0' }
        }
      }}
    >
      <ModalHeader onClose={onClose} title="Edit Listing" />

      {isLoading || !listing ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <CircularProgress />
        </div>
      ) : (
        <>
          <ListingHeader
            listing={listing}
            discountPercentage={discountPercentage}
            lastUpdated={listing.updatedAt}
            onStatusChange={handleStatusChange}
          />

          <TabNavigation
            tabValue={tabValue}
            handleTabChange={handleTabChange}
            listing={listing}
            activeCodes={activeCodes}
          />

          <DialogContent
            sx={{
              p: { xs: 1.5, sm: 2, md: 3 },
              backgroundColor: alpha(theme.palette.background.default, 0.4),
              overflow: 'auto'
            }}
          >
            {/* General Info Tab */}
            <TabPanel value={tabValue} index={0}>
              <ListingForm
                ref={generalFormRef}
                listing={listing}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                section="general"
                hideSubmitButton={true}
                categories={categories}
                availablePlatforms={availablePlatforms}
                sharedFormData={sharedFormData}
                onFormDataChange={setSharedFormData}
              />
            </TabPanel>

            {/* Codes Tab */}
            <TabPanel value={tabValue} index={1}>
              <ListingForm
                ref={codesFormRef}
                listing={listing}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                section="codes"
                hideSubmitButton={true}
                onCodesChange={handleCodesChange}
                sharedFormData={sharedFormData}
                onFormDataChange={setSharedFormData}
              />
            </TabPanel>

            {/* Tags & Languages Tab */}
            <TabPanel value={tabValue} index={2}>
              <ListingForm
                ref={tagsLanguagesFormRef}
                listing={listing}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                section="tagsLanguages"
                hideSubmitButton={true}
                onCodesChange={handleCodesChange}
                sharedFormData={sharedFormData}
                onFormDataChange={setSharedFormData}
              />
            </TabPanel>

            {/* Images Tab */}
            <TabPanel value={tabValue} index={3}>
              <ListingForm
                ref={imagesFormRef}
                listing={listing}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                section="images"
                hideSubmitButton={true}
                onCodesChange={handleCodesChange}
                sharedFormData={sharedFormData}
                onFormDataChange={setSharedFormData}
              />
            </TabPanel>
          </DialogContent>

          <ModalFooter
            onClose={onClose}
            showSaveButton={true}
            onSave={handleSubmit}
            isSubmitting={isSubmitting}
          />
          <Toaster position="top-right" />
        </>
      )}
    </Dialog>
  );
};

export default EditListingModal;
