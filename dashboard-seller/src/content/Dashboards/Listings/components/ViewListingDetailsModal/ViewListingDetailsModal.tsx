import { FC, useState, useEffect } from 'react';
import { Dialog, DialogContent, Zoom, useTheme, alpha } from '@mui/material';

// Import types
import { Listing } from '../../types';

// Import utility functions
import { getActiveCodes, getTotalCodes, getDiscountPercentage } from './utils/listingHelpers';

// Import components
import ModalHeader from './components/ModalHeader';
import LoadingSkeleton from './components/LoadingSkeleton';
import ListingHeader from './components/ListingHeader';
import TabNavigation from './components/TabNavigation';
import TabPanel from './components/TabPanel';
import ModalFooter from './components/ModalFooter';

// Import tab components
import OverviewTab from './components/tabs/OverviewTab';
import CodesTab from './components/tabs/CodesTab';
import TagsLanguagesTab from './components/tabs/TagsLanguagesTab';
import ImagesTab from './components/tabs/ImagesTab';

interface ViewListingDetailsModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string | null;
  listings: Listing[];
}

const ViewListingDetailsModal: FC<ViewListingDetailsModalProps> = ({
  open,
  onClose,
  listingId,
  listings
}) => {
  const theme = useTheme();
  const [listing, setListing] = useState<Listing | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      // Reset tab to first tab when opening modal
      setTabValue(0);

      if (listingId && listings.length > 0) {
        const foundListing = listings.find((item) => item.externalId === listingId);
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy code:', err);
      });
  };

  if (!open) {
    return null;
  }

  const activeCodes = getActiveCodes(listing);
  const totalCodes = getTotalCodes(listing);
  const activePercentage = totalCodes > 0 ? (activeCodes / totalCodes) * 100 : 0;
  const discountPercentage = getDiscountPercentage(listing);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="listing-details-dialog-title"
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
      <ModalHeader onClose={onClose} />

      {isLoading || !listing ? (
        <LoadingSkeleton />
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
            {/* Overview Tab */}
            <TabPanel value={tabValue} index={0}>
              <OverviewTab 
                listing={listing}
                activeCodes={activeCodes}
                totalCodes={totalCodes}
                activePercentage={activePercentage}
              />
            </TabPanel>

            {/* Codes Tab */}
            <TabPanel value={tabValue} index={1}>
              <CodesTab 
                listing={listing}
                activeCodes={activeCodes}
                totalCodes={totalCodes}
                copiedCode={copiedCode}
                handleCopyCode={handleCopyCode}
              />
            </TabPanel>

            {/* Tags & Languages Tab */}
            <TabPanel value={tabValue} index={2}>
              <TagsLanguagesTab listing={listing} />
            </TabPanel>

            {/* Images Tab */}
            {listing.thumbnailUrl && (
              <TabPanel value={tabValue} index={3}>
                <ImagesTab listing={listing} />
              </TabPanel>
            )}
          </DialogContent>

          <ModalFooter 
            createdAt={listing.createdAt} 
            onClose={onClose} 
          />
        </>
      )}
    </Dialog>
  );
};

export default ViewListingDetailsModal;