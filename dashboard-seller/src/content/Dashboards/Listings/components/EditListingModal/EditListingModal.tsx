import { FC, useState, useEffect } from 'react';
import { Dialog, DialogContent, Zoom, useTheme, alpha, CircularProgress, Box, Tabs, Tab, Typography } from '@mui/material';
import toast, { Toaster } from 'react-hot-toast';

// Import types
import { Listing } from '../../types';

// Import utility functions
import { getActiveCodes, getTotalCodes, getDiscountPercentage } from '../ViewListingDetailsModal/utils/listingHelpers';

// Import components
import ModalHeader from './components/ModalHeader';
import ListingHeader from '../ViewListingDetailsModal/components/ListingHeader';
import TabNavigation from '../ViewListingDetailsModal/components/TabNavigation';
import TabPanel from '../ViewListingDetailsModal/components/TabPanel';
import ListingForm from './components/ListingForm';
import ModalFooter from './components/ModalFooter';

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

  const handleSubmit = async (updatedData: Partial<Listing>) => {
    if (!listing) return;
    
    setIsSubmitting(true);
    try {
      // Here you would make an API call to update the listing
      // For now, we'll simulate a successful update
      const updatedListing = {
        ...listing,
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the onListingUpdated callback with the updated listing
      onListingUpdated(updatedListing as Listing);
      
      toast.success('Listing updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to update listing:', error);
      toast.error('Failed to update listing. Please try again.');
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
