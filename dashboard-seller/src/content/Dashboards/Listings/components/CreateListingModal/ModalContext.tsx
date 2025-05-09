import React, { createContext, useContext, ReactNode } from 'react';
import { ModalContextProps } from './types';
import {
  useErrorHandling,
  useFormState,
  useFormHandlers,
  useCategoryData
} from './hooks';

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
    submitting
  } = useFormHandlers({
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    categories,
    selectedCategory,
    setSelectedCategory,
    setPatterns,
    setSelectedPattern,
    setPatternLoading,
    setValidationError,
    setAvailablePlatforms,
    setError,
    onSubmit,
    onClose
  });

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
    handleSubmit,
    handleDateChange,
    handleAddCode,
    handleDeleteCode,
    handleCodeKeyDown,
    resetForm
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
