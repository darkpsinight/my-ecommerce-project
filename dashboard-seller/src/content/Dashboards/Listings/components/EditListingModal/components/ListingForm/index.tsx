import React, { forwardRef, useState, useEffect, useImperativeHandle, useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  SelectChangeEvent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

// Import form sections
import BasicInformation from './sections/BasicInformation';
import Description from './sections/Description';
import Pricing from './sections/Pricing';
import TagsAndLanguages from './sections/TagsAndLanguages';
import UnifiedProductCodeSection from './sections/UnifiedProductCodeSection';
import PaginatedCodesTable from './components/PaginatedCodesTable';
import SellerNotes from './sections/SellerNotes';
import ImageUpload, { ImageUploadRef } from './sections/ImageUpload';

// Import types and utilities
import { FormData, FormErrors, FormRef, ListingFormProps, Listing } from './utils/types';
import { validateForm } from './utils/validation';
import { validateCodeAgainstPattern } from 'src/services/api/validation';
import { checkCodeExists } from 'src/services/api/listings';

/**
 * Main ListingForm component that integrates all form sections
 */
const ListingForm = forwardRef<FormRef, ListingFormProps>(
  ({
    listing,
    onSubmit,
    isSubmitting,
    section = 'general',
    hideSubmitButton = false,
    onCodesChange,
    availablePlatforms = [],
    sharedFormData = null,
    onFormDataChange,
    selectedPattern
  },
  ref
) => {
  // Initialize form data from shared form data or listing prop
  const [formData, setFormData] = useState<FormData>(
    sharedFormData || {
      title: listing.title || '',
      description: listing.description || '',
      price: listing.price ? listing.price.toString() : '',
      originalPrice: listing.originalPrice ? listing.originalPrice.toString() : '',
      platform: listing.platform || '',
      region: listing.region || '',
      isRegionLocked: listing.isRegionLocked || false,
      expirationDate: listing.expirationDate ? new Date(listing.expirationDate) : null,
      categoryId: listing.categoryId || '',
      status: listing.status || 'active',
      autoDelivery: listing.autoDelivery || false,
      thumbnailUrl: listing.thumbnailUrl || '',
      tags: listing.tags || [],
      supportedLanguages: listing.supportedLanguages || [],
      sellerNotes: listing.sellerNotes || '',
      codes: listing.codes || [],
      newCode: '',
      newExpirationDate: null
    }
  );

  // Form validation errors
  const [formErrors, setFormErrors] = useState<FormErrors>({
    title: '',
    description: '',
    price: '',
    region: '',
    thumbnailUrl: '',
    codes: '',
    newCode: ''
  });



  // Update parent component when codes change
  useEffect(() => {
    if (onCodesChange) {
      onCodesChange(formData.codes?.length || 0);
    }
  }, [formData.codes, onCodesChange]);

  // Update form data when sharedFormData changes
  useEffect(() => {
    if (sharedFormData) {
      console.log('sharedFormData changed in ListingForm:', {
        section,
        tags: sharedFormData.tags,
        supportedLanguages: sharedFormData.supportedLanguages
      });
      setFormData(sharedFormData);
    }
  }, [sharedFormData, section]);

  /**
   * Handle text field input changes
   * Can handle either a single field update or multiple field updates at once
   */
  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | { fields?: Record<string, any> }
  ) => {
    // Check if this is a multi-field update
    if ('fields' in e && e.fields) {
      const updatedFormData = { ...formData, ...e.fields };
      setFormData(updatedFormData);

      // Notify parent component of form data change
      if (onFormDataChange) {
        onFormDataChange(updatedFormData);
      }
      return;
    }

    // Handle single field update (original behavior)
    if ('target' in e) {
      const { name, value } = e.target;
      if (name) {
        const updatedFormData = { ...formData, [name]: value };
        setFormData(updatedFormData);

        // Notify parent component of form data change
        if (onFormDataChange) {
          onFormDataChange(updatedFormData);
        }
      }
    }
  };

  /**
   * Handle select input changes
   */
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;

    // Special handling for region selection
    if (name === 'region') {
      // If selecting Global, ensure region lock is disabled
      if (value === 'Global' && formData.isRegionLocked) {
        // Create updated form data with both region and isRegionLocked changes
        const updatedFormData = {
          ...formData,
          [name]: value,
          isRegionLocked: false
        };

        // Update the form data state
        setFormData(updatedFormData);

        // Notify parent component of form data change
        if (onFormDataChange) {
          onFormDataChange(updatedFormData);
        }
        return;
      }
    }

    // For other cases, just update the selected field
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);

    // Notify parent component of form data change
    if (onFormDataChange) {
      onFormDataChange(updatedFormData);
    }
  };

  /**
   * Handle date change
   */
  const handleDateChange = (date: Date | null) => {
    const updatedFormData = { ...formData, newExpirationDate: date };
    setFormData(updatedFormData);

    // Notify parent component of form data change
    if (onFormDataChange) {
      onFormDataChange(updatedFormData);
    }
  };

  /**
   * Custom handleChange for ReactQuill description
   */
  const handleDescriptionChange = (value: string) => {
    const updatedFormData = { ...formData, description: value };
    setFormData(updatedFormData);

    // Notify parent component of form data change
    if (onFormDataChange) {
      onFormDataChange(updatedFormData);
    }
  };

  /**
   * Custom handleChange for ReactQuill seller notes
   */
  const handleSellerNotesChange = (value: string) => {
    const updatedFormData = { ...formData, sellerNotes: value };
    setFormData(updatedFormData);

    // Notify parent component of form data change
    if (onFormDataChange) {
      onFormDataChange(updatedFormData);
    }
  };

  /**
   * Handle code addition
   */
  const handleAddCode = async () => {
    if (!formData.newCode.trim()) {
      setFormErrors(prev => ({ ...prev, newCode: 'Please enter a code' }));
      return;
    }

    // Check if code already exists in the current form
    if (formData.codes?.some(c => c.code === formData.newCode.trim())) {
      setFormErrors(prev => ({ ...prev, newCode: 'This code already exists in this listing' }));
      return;
    }

    // Check if code exists in the database
    try {
      // Show loading state
      setFormErrors(prev => ({ ...prev, newCode: 'Checking code...' }));

      const result = await checkCodeExists(formData.newCode.trim(), listing?.externalId);

      if (result.exists) {
        // Check if it's a duplicate within the same batch
        if (result.listing.isSameBatch) {
          setFormErrors(prev => ({
            ...prev,
            newCode: `This code is a duplicate within the current batch`
          }));
        }
        // Check if it's a duplicate within the same listing
        else if (result.listing.inSameListing) {
          setFormErrors(prev => ({
            ...prev,
            newCode: `This code already exists in this listing`
          }));
        }
        else {
          // Code exists in another listing
          setFormErrors(prev => ({
            ...prev,
            newCode: result.listing.title
              ? `This code already exists in another listing: ${result.listing.title}`
              : `This code already exists in another listing`
          }));
        }
        return;
      }

      // Clear the checking message
      setFormErrors(prev => ({ ...prev, newCode: '' }));
    } catch (error) {
      console.error('Error checking if code exists:', error);
      // Continue with adding the code even if the check fails
      // This is a fallback in case the API is down
    }

    // Create the new code item
    const newCodeItem = {
      // We don't generate a UUID here as it will be generated on the server
      // when the code is saved to the database
      code: formData.newCode.trim(),
      soldStatus: 'active',
      // Add the expiration date to the individual code if it exists
      expirationDate: formData.newExpirationDate
    };

    // Validate against the selected pattern if available
    if (selectedPattern && selectedPattern.regex) {
      const validationResult = validateCodeAgainstPattern(newCodeItem.code, selectedPattern);

      if (!validationResult.isValid) {
        // Mark the code as invalid but still add it
        newCodeItem['isInvalid'] = true;
        newCodeItem['invalidReason'] = validationResult.reason;
      }
    }

    // Add new code
    const updatedCodes = [
      ...(formData.codes || []),
      newCodeItem
    ];

    const updatedFormData = {
      ...formData,
      codes: updatedCodes,
      newCode: '',
      newExpirationDate: null
    };

    setFormData(updatedFormData);
    setFormErrors(prev => ({ ...prev, newCode: '', codes: '' }));

    // Notify parent component of form data change
    if (onFormDataChange) {
      onFormDataChange(updatedFormData);
    }
  };

  /**
   * Handle code deletion
   */
  const handleDeleteCode = (codeToDelete: string) => {
    const updatedCodes = formData.codes?.filter(c => c.code !== codeToDelete) || [];

    const updatedFormData = {
      ...formData,
      codes: updatedCodes
    };

    setFormData(updatedFormData);

    // Notify parent component of form data change
    if (onFormDataChange) {
      onFormDataChange(updatedFormData);
    }
  };

  /**
   * Keydown handler for code input
   */
  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleAddCode(); // Use void to handle the Promise without awaiting
    }
  };

  /**
   * Calculate discount percentage
   */
  const getDiscountPercentage = (): string => {
    if (!formData.originalPrice || !formData.price) return '0';

    const originalPrice = parseFloat(formData.originalPrice);
    const currentPrice = parseFloat(formData.price);

    if (isNaN(originalPrice) || isNaN(currentPrice) || originalPrice <= 0 || currentPrice <= 0) {
      return '0';
    }

    if (currentPrice >= originalPrice) {
      return '0';
    }

    const discount = ((originalPrice - currentPrice) / originalPrice) * 100;
    return discount.toFixed(0);
  };



  // Create a ref for the ImageUpload component
  const imageUploadRef = useRef<ImageUploadRef>(null);

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    const { errors, isValid } = validateForm(formData);

    // Always update form errors to show validation feedback
    setFormErrors(errors);

    if (!isValid) {
      // Scroll to the first error if possible
      const firstErrorField = document.querySelector('.Mui-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // If we're in the images section and have a temporary image, upload it first
    if (section === 'images' && imageUploadRef.current) {
      console.log('Checking for temporary image before form submission');

      // Check if there's a temporary image that needs to be uploaded
      if (imageUploadRef.current.hasTemporaryImage()) {
        console.log('Temporary image found, uploading before form submission');

        // Upload the image before submitting the form
        const uploadSuccess = await imageUploadRef.current.uploadImageBeforeSubmit();

        // If upload failed, stop the submission process
        if (!uploadSuccess) {
          console.error('Image upload failed, stopping form submission');
          return;
        }

        console.log('Image upload successful, continuing with form submission');
      } else {
        console.log('No temporary image found, proceeding with form submission');
      }
    }

    // Convert form data to listing data format
    const listingData = getFormDataForSubmit();

    // Submit the form
    onSubmit(listingData);
  };

  /**
   * Convert form data to listing data format for submission
   */
  const getFormDataForSubmit = (): Partial<Listing> => {
    // Convert form data to listing data format
    const listingData: Partial<Listing> = {};

    // Only include fields that are relevant to the current section
    if (section === 'general') {
      listingData.title = formData.title;
      listingData.description = formData.description;
      listingData.price = parseFloat(formData.price);
      if (formData.originalPrice) {
        listingData.originalPrice = parseFloat(formData.originalPrice);
      }
      listingData.region = formData.region;
      listingData.isRegionLocked = formData.isRegionLocked;
      listingData.autoDelivery = formData.autoDelivery;
      listingData.sellerNotes = formData.sellerNotes;
    }

    if (section === 'codes') {
      // Process codes to handle existing and new codes properly
      if (formData.codes && formData.codes.length > 0) {
        // Filter and process codes
        const processedCodes = formData.codes.map(codeItem => {
          if (codeItem.codeId) {
            // For existing codes (with codeId), only send the codeId and status
            // This prevents sending masked codes back to the server
            return {
              codeId: codeItem.codeId,
              soldStatus: codeItem.soldStatus
            };
          } else if (codeItem.code) {
            // For new codes (without codeId), send the full code and expiration date
            return {
              code: codeItem.code,
              soldStatus: codeItem.soldStatus,
              expirationDate: codeItem.expirationDate
            };
          } else {
            // Fallback case (should not happen)
            console.error('Invalid code item:', codeItem);
            return {
              soldStatus: codeItem.soldStatus || 'active'
            };
          }
        });

        listingData.codes = processedCodes;
      } else {
        listingData.codes = [];
      }
    }

    if (section === 'tagsLanguages') {
      listingData.tags = formData.tags;
      listingData.supportedLanguages = formData.supportedLanguages;
    }

    if (section === 'images') {
      listingData.thumbnailUrl = formData.thumbnailUrl;
    }

    return listingData;
  };

  /**
   * Render different form sections based on the active tab
   */
  const renderFormSection = () => {
    switch (section) {
      case 'general':
        return (
          <Box>
            <BasicInformation
              formData={formData}
              formErrors={formErrors}
              handleTextChange={handleTextChange}
              handleSelectChange={handleSelectChange}
              availablePlatforms={availablePlatforms}
            />

            <Description
              formData={formData}
              formErrors={formErrors}
              handleDescriptionChange={handleDescriptionChange}
            />

            <Pricing
              formData={formData}
              formErrors={formErrors}
              handleTextChange={handleTextChange}
              getDiscountPercentage={getDiscountPercentage}
            />

            <SellerNotes
              formData={formData}
              handleSellerNotesChange={handleSellerNotesChange}
            />

            {!hideSubmitButton && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  sx={{ borderRadius: 2 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Box>
        );

      case 'codes':
        return (
          <Box>
            <UnifiedProductCodeSection
              formData={formData}
              formErrors={formErrors}
              handleTextChange={handleTextChange}
              handleDateChange={handleDateChange}
              handleAddCode={handleAddCode}
              handleDeleteCode={handleDeleteCode}
              handleCodeKeyDown={handleCodeKeyDown}
              selectedPattern={selectedPattern}
              listingId={listing.externalId}
              onRefresh={() => {
                // Always refresh the listing data after a successful CSV upload
                // This ensures the codes table is updated with the latest data from the server
                if (onSubmit) {
                  console.log('Refreshing listing data after CSV upload');
                  // Pass an object with csvUpload flag to trigger a refresh without validation
                  // and indicate this is a CSV upload (to prevent modal closing)
                  onSubmit({ csvUpload: true });
                }
              }}
            />

            {/* Codes Display Table */}
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <PaginatedCodesTable
                codes={formData.codes || []}
                onDeleteCode={handleDeleteCode}
                listingId={listing.externalId || ''}
                onCodeDeleted={() => {
                  console.log('Code deleted successfully - local state already updated');
                }}
              />
            </Box>

            {!hideSubmitButton && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  sx={{ borderRadius: 2 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Box>
        );

      case 'tagsLanguages':
        return (
          <Box>
            <TagsAndLanguages
              formData={formData}
              setFormData={setFormData}
              onFormDataChange={onFormDataChange}
            />

            {!hideSubmitButton && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  sx={{ borderRadius: 2 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Box>
        );

      case 'images':
        return (
          <Box>
            <ImageUpload
              ref={imageUploadRef}
              formData={formData}
              formErrors={formErrors}
              handleTextChange={handleTextChange}
              onSubmit={handleSubmit}
            />

            {!hideSubmitButton && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  sx={{ borderRadius: 2 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    validateForm: () => {
      const { errors, isValid } = validateForm(formData);

      // Update form errors to display validation feedback
      setFormErrors(errors);

      // Scroll to the first error if validation fails
      if (!isValid) {
        setTimeout(() => {
          const firstErrorField = document.querySelector('.Mui-error');
          if (firstErrorField) {
            firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }

      return isValid;
    },
    getFormData: () => {
      // Convert form data to listing data format
      const listingData: Partial<Listing> = {};

      // Only include fields that are relevant to the current section
      if (section === 'general') {
        listingData.title = formData.title;
        listingData.description = formData.description;
        listingData.price = parseFloat(formData.price);
        if (formData.originalPrice) {
          listingData.originalPrice = parseFloat(formData.originalPrice);
        }
        // Do not include platform and categoryId in updates as they cannot be changed
        // listingData.platform = formData.platform;
        // listingData.categoryId = formData.categoryId;
        listingData.region = formData.region;
        listingData.isRegionLocked = formData.isRegionLocked;
        listingData.autoDelivery = formData.autoDelivery;
        listingData.sellerNotes = formData.sellerNotes;
      }

      if (section === 'codes') {
        // Only send new codes to be added, not existing ones
        if (formData.codes && formData.codes.length > 0) {
          // Filter to only include new codes (those without codeId)
          const newCodes = formData.codes.filter(codeItem => !codeItem.codeId);

          if (newCodes.length > 0) {
            // Process new codes to include required properties
            const processedNewCodes = newCodes.map(codeItem => {
              if (codeItem.code) {
                // For new codes, send the full code and expiration date
                return {
                  code: codeItem.code,
                  soldStatus: codeItem.soldStatus || 'active',
                  expirationDate: codeItem.expirationDate
                };
              } else {
                // Fallback case (should not happen)
                console.error('Invalid code item:', codeItem);
                return null;
              }
            }).filter(Boolean); // Remove any null items

            // Only set codes if there are new ones to add
            if (processedNewCodes.length > 0) {
              listingData.newCodes = processedNewCodes;
            }
          }
        }
      }

      if (section === 'tagsLanguages') {
        listingData.tags = formData.tags;
        listingData.supportedLanguages = formData.supportedLanguages;
      }

      if (section === 'images') {
        listingData.thumbnailUrl = formData.thumbnailUrl;
      }

      return listingData;
    },
    getFormDataRaw: () => {
      // Log the raw form data for debugging
      console.log('getFormDataRaw called in section:', section, {
        tags: formData.tags,
        supportedLanguages: formData.supportedLanguages
      });

      // Return the raw form data for saving between tab switches
      return formData;
    },
    // Add a method to upload image if needed before form submission
    uploadImageIfNeeded: async () => {
      // Only relevant for the images section
      if (section === 'images' && imageUploadRef.current) {
        console.log('Checking for temporary image before form submission (from ref method)');

        // Check if there's a temporary image that needs to be uploaded
        if (imageUploadRef.current.hasTemporaryImage()) {
          console.log('Temporary image found, uploading before form submission (from ref method)');

          // Upload the image before submitting the form
          const uploadSuccess = await imageUploadRef.current.uploadImageBeforeSubmit();

          // Return the upload result
          return uploadSuccess;
        }
      }

      // No image to upload or not in images section
      return true;
    }
  }));

  return <Box>{renderFormSection()}</Box>;
});

export default ListingForm;
