import { useState } from 'react';
import { ListingFormData, ListingFormErrors } from '../types';

/**
 * Hook to manage form state
 */
export const useFormState = () => {
  // Initial form data state
  const initialFormData: ListingFormData = {
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    categoryId: '',
    platform: '',
    region: 'Global',
    isRegionLocked: false,
    codes: [],
    newCode: '',
    newExpirationDate: null,
    supportedLanguages: [],
    thumbnailUrl: '',
    autoDelivery: true,
    tags: [],
    sellerNotes: '',
    status: 'active'
  };

  // Initial form errors state
  const initialFormErrors: ListingFormErrors = {
    title: '',
    description: '',
    price: '',
    categoryId: '',
    platform: '',
    region: '',
    newCode: '',
    codes: '',
    thumbnailUrl: ''
  };

  const [formData, setFormData] = useState<ListingFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<ListingFormErrors>(initialFormErrors);

  // Function to reset form to initial state
  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors(initialFormErrors);
  };

  return {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    resetForm
  };
};
