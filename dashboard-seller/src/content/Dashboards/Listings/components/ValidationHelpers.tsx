import { Pattern } from 'src/services/api/validation';

/**
 * Interface for form data
 */
export interface ListingFormData {
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  platform: string;
  region: string;
  isRegionLocked: boolean;
  code: string;
  expirationDate: string;
  quantity: string;
  supportedLanguages: string[];
  thumbnailUrl: string;
  autoDelivery: boolean;
  tags: string[];
  sellerNotes: string;
  status: string;
}

/**
 * Interface for form errors
 */
export interface ListingFormErrors {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  platform: string;
  region: string;
  code: string;
}

/**
 * Validates the listing form data
 * @param formData The form data to validate
 * @returns An object containing validation errors and a boolean indicating if the form is valid
 */
export const validateListingForm = (formData: ListingFormData): { errors: ListingFormErrors; isValid: boolean } => {
  const errors: ListingFormErrors = {
    title: '',
    description: '',
    price: '',
    categoryId: '',
    platform: '',
    region: '',
    code: ''
  };
  let isValid = true;

  // Title validation
  if (!formData.title.trim()) {
    errors.title = 'Title is required';
    isValid = false;
  } else if (formData.title.length > 100) {
    errors.title = 'Title must be less than 100 characters';
    isValid = false;
  }

  // Description validation
  if (!formData.description.trim()) {
    errors.description = 'Description is required';
    isValid = false;
  }

  // Price validation
  if (!formData.price) {
    errors.price = 'Price is required';
    isValid = false;
  } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
    errors.price = 'Price must be a positive number';
    isValid = false;
  }

  // Category validation
  if (!formData.categoryId) {
    errors.categoryId = 'Category is required';
    isValid = false;
  }

  // Platform validation
  if (!formData.platform) {
    errors.platform = 'Platform is required';
    isValid = false;
  }

  // Region validation
  if (!formData.region) {
    errors.region = 'Region is required';
    isValid = false;
  }

  // Code validation
  if (!formData.code.trim()) {
    errors.code = 'Product code is required';
    isValid = false;
  }

  return { errors, isValid };
};

/**
 * Prepares form data for submission by converting string values to appropriate types
 * @param formData The form data to prepare
 * @returns The prepared data ready for submission
 */
export const prepareFormDataForSubmission = (formData: ListingFormData) => {
  return {
    ...formData,
    price: typeof formData.price === 'string' ? parseFloat(formData.price) : formData.price,
    originalPrice: formData.originalPrice ? 
      (typeof formData.originalPrice === 'string' ? parseFloat(formData.originalPrice) : formData.originalPrice) : 
      undefined,
    quantity: formData.quantity ? 
      (typeof formData.quantity === 'string' ? parseInt(formData.quantity, 10) : formData.quantity) : 
      1
  };
};