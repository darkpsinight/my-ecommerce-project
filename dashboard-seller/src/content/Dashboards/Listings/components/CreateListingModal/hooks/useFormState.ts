import { useState } from 'react';
import { ListingFormData, ListingFormErrors } from '../types';

/**
 * Hook to manage form state
 */
export const useFormState = () => {
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    categoryId: '',
    platform: '',
    region: 'Global',
    isRegionLocked: false,
    code: '',
    expirationDate: '',
    supportedLanguages: [],
    thumbnailUrl: '',
    autoDelivery: true,
    tags: [],
    sellerNotes: '',
    status: 'active'
  });

  const [formErrors, setFormErrors] = useState<ListingFormErrors>({
    title: '',
    description: '',
    price: '',
    categoryId: '',
    platform: '',
    region: '',
    code: '',
    thumbnailUrl: ''
  });

  return {
    formData,
    setFormData,
    formErrors,
    setFormErrors
  };
};
