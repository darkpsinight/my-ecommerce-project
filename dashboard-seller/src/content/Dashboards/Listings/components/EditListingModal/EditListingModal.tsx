import { FC, useState, useEffect } from 'react';
import { Dialog, DialogContent, Zoom, useTheme, alpha, CircularProgress } from '@mui/material';
import toast, { Toaster } from 'react-hot-toast';

// Import types
import { Listing } from '../../types';

// Import utility functions
import { getActiveCodes, getTotalCodes, getDiscountPercentage } from '../ViewListingDetailsModal/utils/listingHelpers';

// Import components
import ModalHeader from './components/ModalHeader';
import ListingForm from './components/ListingForm';
import ModalFooter from './components/ModalFooter';

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

  useEffect(() => {
    if (open) {
      setIsLoading(true);

      if (listingId && listings.length > 0) {
        const foundListing = listings.find((item) => item._id === listingId);
        setListing(foundListing || null);
        // Simulate loading for better UX
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      } else {
        setListing(null);
        setIsLoading(false);
      }
    }
  }, [listingId, listings, open]);

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

      <DialogContent
        sx={{
          p: { xs: 1.5, sm: 2, md: 3 },
          backgroundColor: alpha(theme.palette.background.default, 0.4),
          overflow: 'auto'
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <CircularProgress />
          </div>
        ) : listing ? (
          <ListingForm 
            listing={listing} 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div>Listing not found</div>
        )}
      </DialogContent>

      <ModalFooter 
        onClose={onClose} 
      />
      <Toaster position="top-right" />
    </Dialog>
  );
};

export default EditListingModal;
