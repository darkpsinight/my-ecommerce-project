import React from 'react';
import { Box, Divider } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { useModalContext } from '../ModalContext';
import BasicInformationSection from '../sections/BasicInformationSection';
import ProductDetailsSection from '../sections/ProductDetailsSection';
import PricingSection from '../sections/PricingSection';
import UnifiedProductCodeSection from '../sections/UnifiedProductCodeSection';
import AdditionalInformationSection from '../sections/AdditionalInformationSection';
import PaginatedCodesTable from './PaginatedCodesTable';

/**
 * Main content component for the Create New Listing modal
 */
const ModalContent: React.FC = () => {
  const {
    formData,
    setFormData,
    formErrors,
    handleChange,
    handleBlur,
    handleDateChange,
    handleAddCode,
    handleDeleteCode,
    handleCodeKeyDown,
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

      {/* Additional Information Section */}
      <AdditionalInformationSection
        formData={formData}
        handleChange={handleChange}
        handleTagsChange={handleTagsChange}
      />

      {/* Unified Product Code Section with Tabs */}
      <UnifiedProductCodeSection
        formData={formData}
        formErrors={formErrors}
        validationError={validationError}
        selectedPattern={selectedPattern}
        handleChange={handleChange}
        handleDateChange={handleDateChange}
        handleAddCode={handleAddCode}
        handleDeleteCode={handleDeleteCode}
        handleCodeKeyDown={handleCodeKeyDown}
        setFormData={setFormData}
      />

      {/* Codes Display Table */}
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 3 }} />
        <PaginatedCodesTable
          codes={formData.codes}
          onDeleteCode={(code) => handleDeleteCode && handleDeleteCode(code)}
        />
      </Box>

      <Toaster position="top-right" />
    </Box>
  );
};

export default ModalContent;
