import { FC, useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  Zoom,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import toast from 'react-hot-toast';

// Import types
import { Listing } from '../../types';
import {
  FormData as ListingFormData,
  ExtendedListing
} from './components/ListingForm/utils/types';
import { getValidationPatterns } from 'src/services/api/validation';

// Import utility functions
import {
  getActiveCodes,
  getDiscountPercentage
} from '../ViewListingDetailsModal/utils/listingHelpers';

// Import components
import ModalHeader from './components/ModalHeader';
import ListingHeader from './components/ListingHeader';
import TabNavigation from '../ViewListingDetailsModal/components/TabNavigation';
import TabPanel from '../ViewListingDetailsModal/components/TabPanel';
import ListingForm from './components/ListingForm';
import ModalFooter from './components/ModalFooter';

// Import API services
import {
  updateListing,
  getListingById
} from '../../../../../services/api/listings';

// Icons are imported and used in child components

interface EditListingModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string | null;
  listings: Listing[];
  onListingUpdated: (updatedListing: Listing, options?: { keepModalOpen?: boolean }) => void;
  initialCategories?: any[];
}

const EditListingModal: FC<EditListingModalProps> = ({
  open,
  onClose,
  listingId,
  listings,
  onListingUpdated,
  initialCategories = []
}) => {
  const theme = useTheme();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [activeCodes, setActiveCodes] = useState(0);
  const [categories] = useState(initialCategories);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [selectedPattern, setSelectedPattern] = useState(null);
  const [validationPatternsCache, setValidationPatternsCache] = useState<
    Record<string, any>
  >({});
  const [isPatternLoading, setIsPatternLoading] = useState(false);

  // Shared form state to persist data across tabs
  const [sharedFormData, setSharedFormData] = useState<ListingFormData | null>(
    null
  );

  // Create refs to access the ListingForm components
  const generalFormRef = useRef<any>(null);
  const codesFormRef = useRef<any>(null);
  const tagsLanguagesFormRef = useRef<any>(null);
  const imagesFormRef = useRef<any>(null);

  useEffect(() => {
    if (open && listingId) {
      setIsLoading(true);

      // Find the listing in the listings array
      const foundListing = listings.find(
        (item) => item.externalId === listingId
      );

      if (foundListing) {
        setListing(foundListing);
        setActiveCodes(getActiveCodes(foundListing));

        // Initialize shared form data from the listing
        setSharedFormData({
          title: foundListing.title || '',
          description: foundListing.description || '',
          price: foundListing.price ? foundListing.price.toString() : '',
          originalPrice: foundListing.originalPrice
            ? foundListing.originalPrice.toString()
            : '',
          platform: foundListing.platform || '',
          region: foundListing.region || '',
          isRegionLocked: foundListing.isRegionLocked || false,
          expirationDate: foundListing.expirationDate
            ? new Date(foundListing.expirationDate)
            : null,
          categoryId: foundListing.categoryId || '',
          status: foundListing.status || 'active',
          autoDelivery: foundListing.autoDelivery || false,
          thumbnailUrl: foundListing.thumbnailUrl || '',
          tags: foundListing.tags || [],
          supportedLanguages: foundListing.supportedLanguages || [],
          sellerNotes: foundListing.sellerNotes || '',
          codes: foundListing.codes || [],
          newCode: '',
          newExpirationDate: null // Explicitly set to null to ensure it's not defaulting to current date
        });

        // If we have categories, just extract platforms
        if (categories.length > 0) {
          extractPlatformsFromCategories(categories);
        }

        // Fetch validation patterns for the listing's category and platform
        if (foundListing.categoryId && foundListing.platform) {
          // Convert categoryId to string if it's an object
          const categoryIdValue =
            typeof foundListing.categoryId === 'object' &&
            foundListing.categoryId._id
              ? foundListing.categoryId._id
              : foundListing.categoryId;

          // Create a cache key to check if we already have this pattern
          const cacheKey = `${categoryIdValue}:${foundListing.platform}`;

          // Only fetch if not already in cache
          if (!validationPatternsCache[cacheKey]) {
            // Explicitly cast to string to satisfy TypeScript
            fetchValidationPatterns(
              categoryIdValue as string,
              foundListing.platform
            );
          } else {
            console.log(
              'Using cached validation patterns on modal open for',
              cacheKey
            );
            // Use cached patterns
            const cachedPatterns = validationPatternsCache[cacheKey];
            if (cachedPatterns.length === 1) {
              setSelectedPattern(cachedPatterns[0]);
            } else {
              setSelectedPattern(null);
            }
          }
        }
      } else {
        console.error('Listing not found:', listingId);
        setTimeout(() => {
          toast.error('Listing not found');
        }, 100);
      }

      setIsLoading(false);
    }
  }, [open, listingId, listings, categories, validationPatternsCache]);

  // We don't need to fetch categories anymore as they're passed from the parent component

  // Helper function to extract platforms from categories
  const extractPlatformsFromCategories = (categoriesData: any[]) => {
    // Extract all available platforms from categories
    const platforms = categoriesData.reduce((acc: string[], category: any) => {
      if (category.platforms && Array.isArray(category.platforms)) {
        const platformNames = category.platforms
          .filter((platform: any) => platform.isActive)
          .map((platform: any) => platform.name);
        return [...acc, ...platformNames];
      }
      return acc;
    }, []);

    // Remove duplicates and sort alphabetically
    const uniquePlatforms = [...new Set(platforms)].sort();
    setAvailablePlatforms(uniquePlatforms);
  };

  // Fetch validation patterns for the selected category and platform
  const fetchValidationPatterns = async (
    categoryId: string,
    platformName: string
  ) => {
    if (!categoryId || !platformName) return;

    // Create a cache key using categoryId and platformName
    const cacheKey = `${categoryId}:${platformName}`;

    // Check if we already have this pattern in the cache
    if (validationPatternsCache[cacheKey]) {
      console.log('Using cached validation patterns for', cacheKey);
      const cachedPatterns = validationPatternsCache[cacheKey];

      // If there's only one pattern, select it automatically
      if (cachedPatterns.length === 1) {
        setSelectedPattern(cachedPatterns[0]);
      } else {
        setSelectedPattern(null);
      }
      return;
    }

    // If not in cache, make the API call
    try {
      console.log('Fetching validation patterns for', cacheKey);
      setIsPatternLoading(true);
      const response = await getValidationPatterns(categoryId, platformName);

      if (response && response.success && response.data) {
        const { patterns: responsePatterns } = response.data;

        // Store in cache for future use
        setValidationPatternsCache((prevCache) => ({
          ...prevCache,
          [cacheKey]: responsePatterns
        }));

        // If there's only one pattern, select it automatically
        if (responsePatterns.length === 1) {
          setSelectedPattern(responsePatterns[0]);
        } else {
          setSelectedPattern(null);
        }
      } else {
        console.error(
          'Failed to load validation patterns:',
          response.message || 'Unknown error'
        );
        toast.error('Failed to load validation patterns');
      }
    } catch (err) {
      console.error('Error fetching validation patterns:', err);
      toast.error('Failed to load validation patterns');
    } finally {
      setIsPatternLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    // Save the current tab's form data before switching
    const currentFormRef = getCurrentFormRef();

    if (currentFormRef.current?.getFormDataRaw && sharedFormData) {
      // Get the current form data
      const currentFormData = currentFormRef.current.getFormDataRaw();

      // Log the current tab's form data for debugging
      console.log('Tab change - Current tab form data:', {
        fromTabIndex: tabValue,
        fromTabName: ['general', 'codes', 'tagsLanguages', 'images'][tabValue],
        toTabIndex: newValue,
        toTabName: ['general', 'codes', 'tagsLanguages', 'images'][newValue],
        tags: currentFormData.tags,
        supportedLanguages: currentFormData.supportedLanguages
      });

      // Update the shared form data with the current tab's data
      const updatedSharedFormData = {
        ...sharedFormData,
        ...currentFormData
      };

      // Set the updated shared form data
      setSharedFormData(updatedSharedFormData);

      // Log the updated shared form data for debugging
      console.log('Tab change - Updated shared form data:', {
        tags: updatedSharedFormData.tags,
        supportedLanguages: updatedSharedFormData.supportedLanguages
      });
    }

    // Switch to the new tab
    setTabValue(newValue);
  };

  // This function is no longer needed as we're handling active code count in handleFormDataChange
  const handleCodesChange = (codesCount: number) => {
    // We don't use this parameter anymore as we calculate active codes directly from the codes array
    // This function is kept for backward compatibility
    console.log('handleCodesChange called with count:', codesCount);
  };

  // Custom handler for form data changes
  const handleFormDataChange = (updatedFormData: any) => {
    // Update the shared form data
    setSharedFormData(updatedFormData);

    // Update the listing state with the updated form data
    // This is important for code status updates to be reflected in the listing object
    if (listing && updatedFormData.codes) {
      // Update the listing state
      setListing({
        ...listing,
        codes: updatedFormData.codes
      });

      // Update the activeCodes count
      // Count codes with soldStatus === 'active'
      const activeCodesCount = updatedFormData.codes.filter(
        (code: any) => code.soldStatus === 'active'
      ).length;

      // Update the activeCodes state
      setActiveCodes(activeCodesCount);
    }
  };

  // Handle status change from the header
  const handleStatusChange = async (newStatus: 'active' | 'draft') => {
    if (!listing) return;

    // Check if the listing has codes when trying to set it to active
    if (
      newStatus === 'active' &&
      (!listing.codes || listing.codes.length === 0)
    ) {
      setTimeout(() => {
        toast.error('A listing must have at least one code to be active');
      }, 100);
      return;
    }

    // Check if any codes are active when trying to set listing to active
    if (
      newStatus === 'active' &&
      listing.codes &&
      listing.codes.length > 0 &&
      !listing.codes.some(code => code.soldStatus === 'active')
    ) {
      setTimeout(() => {
        toast.error('At least one code must be On Sale to change listing status to On Sale');
      }, 100);
      return;
    }

    // Set submitting state to show loading indicator
    setIsSubmitting(true);

    // Prepare the data for API call
    const apiData = {
      status: newStatus
    };

    try {
      // Make the API call to update the listing status
      const response = await updateListing(listing.externalId, apiData);

      // Get the actual status from the API response
      const actualStatus = response?.data?.status || newStatus;

      // Create an updated listing object with the response data and existing data
      const updatedListing = {
        ...listing,
        status: actualStatus,
        updatedAt: new Date().toISOString()
      };

      // Only update the UI after successful API call
      setListing(updatedListing);

      // Update the listings array in the parent component without closing the modal
      // We're using a custom event to notify the parent component about the update
      // This prevents the modal from closing when the status is updated
      const customEvent = new CustomEvent('listingStatusUpdated', {
        detail: { updatedListing }
      });
      window.dispatchEvent(customEvent);

      // Show the correct toast message based on the actual status
      setTimeout(() => {
        if (actualStatus !== newStatus) {
          // If the status in the response is different from what we requested
          if (actualStatus === 'suspended') {
            toast.error(
              'Listing cannot be activated: A listing must have at least one code to be active'
            );
          } else if (actualStatus === 'draft' && newStatus === 'active') {
            // More informative message when trying to change from Draft to On Sale
            toast.error(
              'At least one code must be On Sale to change listing status to On Sale'
            );
          } else {
            // Use default toast with an icon for info messages
            toast(
              `Listing status is ${
                actualStatus === 'active'
                  ? 'On Sale'
                  : actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)
              }`
            );
          }
        } else {
          toast.success(
            `Listing status updated to ${
              actualStatus === 'active'
                ? 'On Sale'
                : actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)
            }`
          );
        }
      }, 100);
    } catch (error: any) {
      console.error('Failed to update listing status:', error);

      // Revert the local state if the API call fails
      setListing({
        ...listing,
        status: listing.status // Revert to original status
      });

      const errorMessage =
        error.response?.data?.message ||
        'Failed to update listing status. Please try again.';
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
    // First, save the current tab's form data to the shared form data
    const activeFormRef = getCurrentFormRef();

    // Create a local copy of the shared form data to work with
    let currentSharedFormData = { ...sharedFormData };

    if (activeFormRef.current?.getFormDataRaw && currentSharedFormData) {
      // Get the current form data
      const activeFormData = activeFormRef.current.getFormDataRaw();

      // Log the active form data for debugging
      console.log('Active form data in collectFormData:', {
        tabIndex: tabValue,
        tabName: ['general', 'codes', 'tagsLanguages', 'images'][tabValue],
        tags: activeFormData.tags,
        supportedLanguages: activeFormData.supportedLanguages
      });

      // Update the local copy of shared form data with the current tab's data
      currentSharedFormData = {
        ...currentSharedFormData,
        ...activeFormData
      };

      // Also update the state for future reference
      setSharedFormData(currentSharedFormData);
    }

    // Create a comprehensive listing data object from the shared form data
    const formData: Partial<Listing> = {};

    if (currentSharedFormData) {
      // Convert shared form data to listing data format

      // General tab data
      formData.title = currentSharedFormData.title;
      formData.description = currentSharedFormData.description;
      formData.price = parseFloat(currentSharedFormData.price);
      if (currentSharedFormData.originalPrice) {
        formData.originalPrice = parseFloat(
          currentSharedFormData.originalPrice
        );
      }
      formData.region = currentSharedFormData.region;
      formData.isRegionLocked = currentSharedFormData.isRegionLocked;
      formData.autoDelivery = currentSharedFormData.autoDelivery;
      formData.sellerNotes = currentSharedFormData.sellerNotes;

      // Codes tab data
      // Use the codes from the shared form data instead of the original listing
      // This ensures any newly added codes in the UI are included in the submission
      // Use type assertion to handle the type mismatch between FormData codes and Listing codes
      formData.codes = (currentSharedFormData.codes || []) as any;

      // Tags & Languages tab data
      formData.tags = currentSharedFormData.tags;
      formData.supportedLanguages = currentSharedFormData.supportedLanguages;

      // Images tab data
      formData.thumbnailUrl = currentSharedFormData.thumbnailUrl;

      // Log the tags and languages for debugging
      console.log('Tags in collectFormData:', formData.tags);
      console.log(
        'Supported Languages in collectFormData:',
        formData.supportedLanguages
      );
    } else {
      // Fallback to the old method if shared form data is not available
      console.warn(
        'Shared form data not available, falling back to individual form data collection'
      );

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
    }

    // Log the collected form data for debugging
    console.log('Collected form data from all tabs:', formData);

    // Log the codes specifically to help debug code-related issues
    console.log(
      'Codes being sent to API:',
      formData.codes ? formData.codes.length : 0,
      'codes'
    );
    if (formData.codes && formData.codes.length > 0) {
      console.log('First few codes:', formData.codes.slice(0, 3));
    }

    return formData;
  };

  // Function to fetch the updated listing data from the server
  const fetchUpdatedListing = async (listingId: string) => {
    try {
      console.log('Fetching updated listing data for:', listingId);
      const response = await getListingById(listingId);

      if (response && response.success && response.data) {
        // Update the local state with the fresh data from the server
        setListing(response.data);
        setActiveCodes(getActiveCodes(response.data));

        // Update the shared form data with the fresh data
        setSharedFormData((prevData) => ({
          ...prevData,
          codes: response.data.codes || []
        }));

        console.log(
          'Updated listing data fetched successfully:',
          response.data
        );
        return response.data;
      } else {
        console.error('Failed to fetch updated listing data:', response);
        return null;
      }
    } catch (error) {
      console.error('Error fetching updated listing data:', error);
      return null;
    }
  };

  const handleSubmit = async (_updatedData: ExtendedListing = {}) => {
    if (!listing) return;

    // Get the current form ref
    const currentFormRef = getCurrentFormRef();

    // Check if this is a refresh request (empty object passed) or a save action from the footer
    const isRefreshRequest = Object.keys(_updatedData).length === 0;
    const isSaveAction = _updatedData._saveAction === true;
    // Check if this is a CSV upload request
    const isCsvUpload = _updatedData.csvUpload === true;

    // Remove the _saveAction flag if it exists
    if (isSaveAction) {
      delete _updatedData._saveAction;
    }

    // Only validate the form if this is not a refresh request or CSV upload
    if (
      (!isRefreshRequest || isSaveAction) &&
      !isCsvUpload &&
      currentFormRef.current?.validateForm
    ) {
      // Directly call validateForm to trigger validation and display errors
      const isValid = currentFormRef.current.validateForm();

      if (!isValid) {
        setTimeout(() => {
          toast.error('Please fix the errors in the form before submitting');
        }, 100);
        return;
      }

      // If we're in the images tab or this is a save action from the footer, check if we need to upload an image first
      if (
        (tabValue === 3 || isSaveAction) &&
        currentFormRef.current.uploadImageIfNeeded
      ) {
        console.log(
          'Checking if image upload is needed before form submission'
        );

        // Set submitting state to show loading indicator
        setIsSubmitting(true);

        try {
          // Upload the image if needed
          const uploadSuccess =
            await currentFormRef.current.uploadImageIfNeeded();

          // If upload failed, stop the submission process
          if (!uploadSuccess) {
            console.error('Image upload failed, stopping form submission');
            setIsSubmitting(false);
            return;
          }

          // If this is just an image update from the images tab or footer save button,
          // and we're not in the middle of a CSV upload or refresh request,
          // we can optimize by only updating the thumbnailUrl
          if (
            (tabValue === 3 || isSaveAction) &&
            !isCsvUpload &&
            !isRefreshRequest &&
            currentFormRef.current === imagesFormRef.current
          ) {
            // Get just the image data from the form
            const imageData = currentFormRef.current.getFormData();

            if (imageData && imageData.thumbnailUrl) {
              console.log(
                'Optimized image update - only sending thumbnailUrl to API'
              );

              // Make the API call with just the thumbnailUrl
              await updateListing(listing.externalId, {
                thumbnailUrl: imageData.thumbnailUrl
              });

              // Update the local listing object
              const updatedListing = {
                ...listing,
                thumbnailUrl: imageData.thumbnailUrl,
                updatedAt: new Date().toISOString()
              };

              // Call the onListingUpdated callback with the updated listing
              if (isCsvUpload) {
                // Pass keepModalOpen: true to prevent the modal from closing
                onListingUpdated(updatedListing as Listing, { keepModalOpen: true });
              } else {
                onListingUpdated(updatedListing as Listing);
              }

              setTimeout(() => {
                toast.success('Image updated successfully');
              }, 100);

              setIsSubmitting(false);

              // Only close the modal if this is a regular image update, not a CSV upload
              if (!isCsvUpload) {
                onClose();
              }
              return;
            }
          }

          console.log(
            'Image upload check completed, continuing with form submission'
          );
        } catch (error) {
          console.error('Error during image upload:', error);
          toast.error('Failed to upload image. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }
    }

    // If this is a refresh request, CSV upload, and not a save action, fetch the updated listing data
    if ((isRefreshRequest || isCsvUpload) && !isSaveAction) {
      setIsSubmitting(true);
      try {
        // Fetch the updated listing data from the server
        const updatedListing = await fetchUpdatedListing(listing.externalId);

        if (updatedListing) {
          // Call the onListingUpdated callback with the updated listing
          // Pass keepModalOpen: true to prevent the modal from closing
          onListingUpdated(updatedListing as Listing, { keepModalOpen: true });

          // Show a success toast for CSV uploads
          if (isCsvUpload) {
            setTimeout(() => {
              toast.success('Codes uploaded successfully');
            }, 100);
          }
        }
      } catch (error: any) {
        console.error('Failed to refresh listing data:', error);
        const errorMessage =
          error.response?.data?.message ||
          'Failed to refresh listing data. Please try again.';
        setTimeout(() => {
          toast.error(errorMessage);
        }, 100);
      } finally {
        // Add a small delay before setting isSubmitting to false
        // This ensures the modal doesn't close immediately after the toast appears
        setTimeout(() => {
          setIsSubmitting(false);
        }, 1000); // Increased timeout to 1 second
      }
      // Don't close the modal, just return
      return;
    }

    // For normal updates, collect data from all forms
    // First, ensure the current tab's form data is saved to the shared form data
    if (currentFormRef.current?.getFormDataRaw && sharedFormData) {
      const currentTabFormData = currentFormRef.current.getFormDataRaw();

      // Log the current tab's form data for debugging
      console.log('Current tab form data before update:', {
        tabIndex: tabValue,
        tabName: ['general', 'codes', 'tagsLanguages', 'images'][tabValue],
        tags: currentTabFormData.tags,
        supportedLanguages: currentTabFormData.supportedLanguages
      });

      // Update the shared form data with the current tab's data
      const updatedSharedFormData = {
        ...sharedFormData,
        ...currentTabFormData
      };

      // Set the updated shared form data
      setSharedFormData(updatedSharedFormData);

      // Log the updated shared form data for debugging
      console.log('Updated shared form data:', {
        tags: updatedSharedFormData.tags,
        supportedLanguages: updatedSharedFormData.supportedLanguages
      });
    }

    // Force synchronous update of shared form data before collecting all form data
    // This is important because setState is asynchronous
    const updatedFormData = collectFormData();

    // Log the collected form data for debugging
    console.log('Collected form data after update:', {
      tags: updatedFormData.tags,
      supportedLanguages: updatedFormData.supportedLanguages
    });

    // Convert categoryId to string if it's an object
    const apiData: any = { ...updatedFormData };
    if (apiData.categoryId && typeof apiData.categoryId === 'object') {
      apiData.categoryId = apiData.categoryId._id;
    }

    console.log('Sending API data with all tab changes:', apiData);

    // Log specifically about tags and languages for debugging
    console.log('Tags being sent to API:', apiData.tags);
    console.log(
      'Supported Languages being sent to API:',
      apiData.supportedLanguages
    );

    // Log specifically about codes for debugging
    if (apiData.codes) {
      console.log(`Submitting ${apiData.codes.length} codes to the API`);
    } else {
      console.log('No codes in the API data');
    }

    setIsSubmitting(true);
    try {
      // Log the API data for debugging
      console.log('Updating listing with data:', apiData);

      // Make the API call to update the listing
      await updateListing(listing.externalId, apiData);

      // Create an updated listing object with the response data and existing data
      const updatedListing = {
        ...listing,
        ...updatedFormData,
        updatedAt: new Date().toISOString()
      };

      // Call the onListingUpdated callback with the updated listing
      if (isCsvUpload) {
        // Pass keepModalOpen: true to prevent the modal from closing
        onListingUpdated(updatedListing as Listing, { keepModalOpen: true });
      } else {
        onListingUpdated(updatedListing as Listing);
      }

      setTimeout(() => {
        toast.success('Listing updated successfully');
      }, 100);

      // Only close the modal if this is a regular update, not a CSV upload
      if (!isCsvUpload) {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to update listing:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Failed to update listing. Please try again.';
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

  // We don't need totalCodes here as it's not used in the UI
  const discountPercentage = listing ? getDiscountPercentage(listing) : null;

  // Custom onClose handler to prevent modal from closing during CSV upload
  const handleDialogClose = (_event: {}, _reason: string) => {
    // If we're currently submitting (which includes CSV upload), don't close the modal
    if (isSubmitting) {
      return;
    }

    // Otherwise, call the regular onClose function
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="edit-listing-dialog-title"
      TransitionComponent={Zoom}
      transitionDuration={300}
      // Disable closing on backdrop click and escape key when submitting
      disableEscapeKeyDown={isSubmitting}
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
      <ModalHeader
        onClose={onClose}
        title={`Edit Listing${isPatternLoading ? ' (Loading Patterns...)' : ''}`}
        isSubmitting={isSubmitting}
      />

      {isLoading || !listing ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '40px 0'
          }}
        >
          <CircularProgress />
        </div>
      ) : (
        <>
          <ListingHeader
            listing={listing}
            discountPercentage={discountPercentage}
            lastUpdated={listing.updatedAt}
            onStatusChange={handleStatusChange}
            isSubmitting={isSubmitting}
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
                onFormDataChange={handleFormDataChange}
                fetchValidationPatterns={fetchValidationPatterns}
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
                onFormDataChange={handleFormDataChange}
                selectedPattern={selectedPattern}
                fetchValidationPatterns={fetchValidationPatterns}
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
                onFormDataChange={handleFormDataChange}
                fetchValidationPatterns={fetchValidationPatterns}
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
                onFormDataChange={handleFormDataChange}
                fetchValidationPatterns={fetchValidationPatterns}
              />
            </TabPanel>
          </DialogContent>

          <ModalFooter
            onClose={onClose}
            showSaveButton={true}
            onSave={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </>
      )}
    </Dialog>
  );
};

export default EditListingModal;
