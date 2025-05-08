import React from 'react';
import { Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { useModalContext } from '../ModalContext';
import BasicInformationSection from '../sections/BasicInformationSection';
import ProductDetailsSection from '../sections/ProductDetailsSection';
import PricingSection from '../sections/PricingSection';
import ProductCodeSection from '../sections/ProductCodeSection';

/**
 * Main content component for the Create New Listing modal
 */
const ModalContent: React.FC = () => {
  const {
    formData,
    formErrors,
    handleChange,
    handleBlur,
    handleDateChange,
    categories,
    availablePlatforms,
    regions,
    selectedPattern,
    validationError,
  } = useModalContext();

  // Custom handleChange for ReactQuill
  const handleDescriptionChange = (value: string) => {
    const syntheticEvent = {
      target: {
        name: 'description',
        value,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(syntheticEvent);
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIsLocked = e.target.checked;
    const fieldsToUpdate: Record<string, any> = {
      [e.target.name]: newIsLocked
    };

    // Update region value based on the new isRegionLocked state
    if (newIsLocked && formData.region === 'Global') {
      // If enabling region lock and region is Global, clear the region
      fieldsToUpdate.region = '';
    } else if (!newIsLocked && formData.region !== 'Global') {
      // If disabling region lock, set region to Global
      fieldsToUpdate.region = 'Global';
    }

    // Update all fields at once to ensure UI updates in a single render
    handleChange({ fields: fieldsToUpdate });
  };

  // Handle tags change
  const handleTagsChange = (event, newValue) => {
    const syntheticEvent = {
      target: {
        name: 'tags',
        value: newValue
      }
    };
    handleChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <Box sx={{ py: 1 }}>
      {/* Basic Information Section */}
      <BasicInformationSection
        formData={formData}
        formErrors={formErrors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        handleDescriptionChange={handleDescriptionChange}
      />

      {/* Product Details Section */}
      <ProductDetailsSection
        formData={formData}
        formErrors={formErrors}
        handleChange={handleChange}
        handleCheckboxChange={handleCheckboxChange}
        categories={categories}
        availablePlatforms={availablePlatforms}
        regions={regions}
      />

      {/* Pricing Section */}
      <PricingSection
        formData={formData}
        formErrors={formErrors}
        handleChange={handleChange}
      />

      {/* Product Code Section */}
      <ProductCodeSection
        formData={formData}
        formErrors={formErrors}
        validationError={validationError}
        selectedPattern={selectedPattern}
        handleChange={handleChange}
        handleTagsChange={handleTagsChange}
        handleDateChange={handleDateChange}
      />

      <Toaster position="top-right" />
    </Box>
  );
};

export default ModalContent;
