import { FC, useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, Zoom, useTheme, alpha, CircularProgress, Box, Tabs, Tab, Typography } from '@mui/material';
import toast, { Toaster } from 'react-hot-toast';

// Import types
import { Listing } from '../../types';

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
import { updateListing } from '../../../../../services/api/listings';

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
  
  // Create refs to access the ListingForm components
  const generalFormRef = useRef<any>(null);
  const codesFormRef = useRef<any>(null);
  const tagsLanguagesFormRef = useRef<any>(null);
  const imagesFormRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      // Reset tab to first tab when opening modal
      setTabValue(0);

      if (listingId && listings.length > 0) {
        const foundListing = listings.find((item) => item._id === listingId);
        setListing(foundListing || null);
        
        // Set initial active codes count
        if (foundListing) {
          const initialActiveCodes = getActiveCodes(foundListing);
          setActiveCodes(initialActiveCodes);
        }
        
        // Simulate loading for better UX
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } else {
        setListing(null);
        setActiveCodes(0);
        setIsLoading(false);
      }
    }
  }, [listingId, listings, open]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCodesChange = (codesCount: number) => {
    // For simplicity, we're assuming all new codes are active
    setActiveCodes(codesCount);
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
    if (currentFormRef.current?.validateForm && !currentFormRef.current.validateForm()) {
      toast.error('Please fix the errors in the form before submitting');
      return;
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
      const response = await updateListing(listing._id, apiData);
      
      // Create an updated listing object with the response data and existing data
      const updatedListing = {
        ...listing,
        ...formData,
        updatedAt: new Date().toISOString()
      };
      
      // Call the onListingUpdated callback with the updated listing
      onListingUpdated(updatedListing as Listing);
      
      toast.success('Listing updated successfully');
      onClose();
    } catch (error: any) {
      console.error('Failed to update listing:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update listing. Please try again.';
      toast.error(errorMessage);
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
                onCodesChange={handleCodesChange}
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
              />
            </TabPanel>

            {/* Images Tab */}
            {listing.thumbnailUrl && (
              <TabPanel value={tabValue} index={3}>
                <ListingForm 
                  ref={imagesFormRef}
                  listing={listing} 
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  section="images"
                  hideSubmitButton={true}
                  onCodesChange={handleCodesChange}
                />
              </TabPanel>
            )}
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
