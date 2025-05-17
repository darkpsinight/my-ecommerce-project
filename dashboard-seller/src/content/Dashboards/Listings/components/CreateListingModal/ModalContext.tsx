import React, { createContext, useContext, ReactNode, useState } from 'react';
import { ModalContextProps } from './types';
import {
  useErrorHandling,
  useFormState,
  useFormHandlers,
  useCategoryData
} from './hooks';
import { uploadImage } from 'src/services/api/imageUpload';

const ModalContext = createContext<ModalContextProps | null>(null);

interface ModalProviderProps {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  onSubmit: (response: any) => void;
  // Optional categories data that might be passed from parent
  initialCategories?: any[];
}

export const ModalProvider: React.FC<ModalProviderProps> = ({
  children,
  open,
  onClose,
  onSubmit,
  initialCategories = []
}) => {
  // Use custom hooks to manage different aspects of the component
  const { error, setError, bottomErrorRef } = useErrorHandling();

  const { formData, setFormData, formErrors, setFormErrors, resetForm } = useFormState();

  // State for temporary image file and upload status
  const [temporaryImageFile, setTemporaryImageFile] = useState<File | null>(null);
  const [imageUploadInProgress, setImageUploadInProgress] = useState<boolean>(false);

  // State for URL input method
  const [imageUrl, setImageUrl] = useState<string>('');

  // State to track if form submission has been attempted
  const [formSubmitAttempted, setFormSubmitAttempted] = useState<boolean>(false);

  const {
    categories,
    availablePlatforms,
    setAvailablePlatforms,
    selectedCategory,
    setSelectedCategory,
    patterns,
    setPatterns,
    selectedPattern,
    setSelectedPattern,
    patternLoading,
    setPatternLoading,
    validationError,
    setValidationError,
    regions,
    loading
  } = useCategoryData(open, setError, initialCategories);

  const {
    handleChange,
    handleBlur,
    validateForm,
    handleSubmit,
    handleDateChange,
    handleAddCode,
    handleDeleteCode,
    handleCodeKeyDown,
    submitting,
    setSubmitting
  } = useFormHandlers({
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    categories,
    selectedCategory,
    setSelectedCategory,
    setPatterns,
    selectedPattern,
    setSelectedPattern,
    setPatternLoading,
    setValidationError,
    setAvailablePlatforms,
    setError,
    onSubmit,
    onClose
  });

  // Handle image file selection
  const handleImageFileSelect = (file: File | null) => {
    setTemporaryImageFile(file);
  };

  // Handle image URL input
  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);

    // Update the form data with the new URL
    setFormData(prev => ({
      ...prev,
      thumbnailUrl: url
    }));
  };

  // Custom submit handler that first uploads the image if needed
  const handleSubmitWithImageUpload = async () => {
    // Set form submission attempted to true
    setFormSubmitAttempted(true);

    // First validate the form before attempting any upload
    if (!validateForm()) {
      // Scroll to the codes section if there's an error with codes
      if (formErrors.codes) {
        const codesSection = document.getElementById('codes-section');
        if (codesSection) {
          codesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    // If there's a temporary image file, upload it first
    if (temporaryImageFile) {
      try {
        setImageUploadInProgress(true);
        setError(null); // Clear any previous errors

        // Process the image and upload it to ImageKit.io
        const imageUrl = await uploadImage(temporaryImageFile);

        // Update the form data with the new image URL
        setFormData(prev => ({
          ...prev,
          thumbnailUrl: imageUrl
        }));

        // Clear the temporary file
        setTemporaryImageFile(null);

        // Now proceed with the regular form submission
        await handleSubmit();
      } catch (error) {
        console.error('Error uploading image:', error);
        setError('Failed to upload image. Please try again.');
        setSubmitting(false); // Ensure submitting state is reset
      } finally {
        setImageUploadInProgress(false);
      }
    } else {
      // No image file to upload, but ensure the thumbnailUrl is included in the form data
      // This handles the case where the user entered a URL directly
      if (imageUrl && imageUrl.trim() !== '') {
        console.log('Using URL input for thumbnailUrl:', imageUrl);

        // Make sure the form data has the latest URL
        setFormData(prev => ({
          ...prev,
          thumbnailUrl: imageUrl
        }));
      }

      // Proceed with regular submission
      try {
        await handleSubmit();
      } catch (error) {
        console.error('Error submitting form:', error);
        setError('An unexpected error occurred. Please try again.');
        setSubmitting(false); // Ensure submitting state is reset
      }
    }
  };

  // Create the context value with all the state and handlers
  const contextValue: ModalContextProps = {
    categories,
    availablePlatforms,
    selectedCategory,
    patterns,
    selectedPattern,
    patternLoading,
    validationError,
    regions,
    loading,
    submitting,
    error,
    formData,
    setFormData,
    formErrors,
    handleChange,
    handleBlur,
    handleSubmit: handleSubmitWithImageUpload, // Replace with our custom handler
    handleDateChange,
    handleAddCode,
    handleDeleteCode,
    handleCodeKeyDown,
    resetForm,
    // Add new image-related properties
    temporaryImageFile,
    handleImageFileSelect,
    imageUploadInProgress,
    // Add URL-related properties
    imageUrl,
    handleImageUrlChange,
    // Expose setSubmitting for better control of loading states
    setSubmitting,
    // Add form submission attempt tracking
    formSubmitAttempted,
    setFormSubmitAttempted
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      <div ref={bottomErrorRef} />
    </ModalContext.Provider>
  );
};

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};
