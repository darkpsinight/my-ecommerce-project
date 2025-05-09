import React, { forwardRef, useState, useEffect, useImperativeHandle } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

// Import form sections
import BasicInformation from './sections/BasicInformation';
import Description from './sections/Description';
import Pricing from './sections/Pricing';
import TagsAndLanguages from './sections/TagsAndLanguages';
import ProductCodes from './sections/ProductCodes';
import SellerNotes from './sections/SellerNotes';
import ImageUpload from './sections/ImageUpload';

// Import types and utilities
import { FormData, FormErrors, FormRef, ListingFormProps, Listing } from './utils/types';
import { validateForm } from './utils/validation';

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
    onFormDataChange
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
      newCode: ''
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
      setFormData(sharedFormData);
    }
  }, [sharedFormData]);

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
    const updatedFormData = { ...formData, expirationDate: date };
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
  const handleAddCode = () => {
    if (!formData.newCode.trim()) {
      setFormErrors(prev => ({ ...prev, newCode: 'Please enter a code' }));
      return;
    }

    // Check if code already exists
    if (formData.codes?.some(c => c.code === formData.newCode.trim())) {
      setFormErrors(prev => ({ ...prev, newCode: 'This code already exists' }));
      return;
    }

    // Add new code
    const updatedCodes = [
      ...(formData.codes || []),
      {
        // We don't generate a UUID here as it will be generated on the server
        // when the code is saved to the database
        code: formData.newCode.trim(),
        soldStatus: 'active'
      }
    ];

    const updatedFormData = {
      ...formData,
      codes: updatedCodes,
      newCode: ''
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
      handleAddCode();
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



  /**
   * Handle form submission
   */
  const handleSubmit = () => {
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
      listingData.codes = formData.codes;
      if (formData.expirationDate) {
        listingData.expirationDate = formData.expirationDate;
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
            <ProductCodes
              formData={formData}
              formErrors={formErrors}
              handleTextChange={handleTextChange}
              handleDateChange={handleDateChange}
              handleAddCode={handleAddCode}
              handleDeleteCode={handleDeleteCode}
              handleCodeKeyDown={handleCodeKeyDown}
            />

            {/* CSV Upload Component */}
            {listing && listing.externalId && (
              <Box sx={{ mt: 3 }}>
                {/* Import dynamically to avoid circular dependencies */}
                {React.createElement(
                  require('../../../../components/CSVUpload').default,
                  {
                    listingId: listing.externalId,
                    onSuccess: (data) => {
                      // Update the codes count in the parent component
                      if (onCodesChange) {
                        onCodesChange(data.totalCodes);
                      }

                      // Refresh the listing data
                      if (onSubmit) {
                        onSubmit({});
                      }
                    }
                  }
                )}
              </Box>
            )}

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
              formData={formData}
              formErrors={formErrors}
              handleTextChange={handleTextChange}
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
        listingData.codes = formData.codes;
        if (formData.expirationDate) {
          listingData.expirationDate = formData.expirationDate;
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
      // Return the raw form data for saving between tab switches
      return formData;
    }
  }));

  return <Box>{renderFormSection()}</Box>;
});

export default ListingForm;
