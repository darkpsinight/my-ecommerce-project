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
  expirationDate: string | Date | null;
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
  thumbnailUrl: string;
}

/**
 * Validates if a string is a valid URL
 * @param url The URL to validate
 * @returns A boolean indicating if the URL is valid
 */
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

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
    code: '',
    thumbnailUrl: ''
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

  // Thumbnail URL validation
  if (formData.thumbnailUrl && !isValidUrl(formData.thumbnailUrl)) {
    errors.thumbnailUrl = 'Please enter a valid URL';
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
  // Create a copy of the form data to avoid mutating the original
  const processedData = { ...formData };

  console.log('Original form data:', JSON.stringify(formData, null, 2));
  console.log('Original expirationDate:', formData.expirationDate);
  console.log('Type of expirationDate:', typeof formData.expirationDate);

  // Format expirationDate as ISO date-time string if it exists
  let formattedExpirationDate = undefined;
  if (formData.expirationDate) {
    if (formData.expirationDate instanceof Date) {
      // If it's a Date object, format it to ISO string
      formattedExpirationDate = formData.expirationDate.toISOString();
    } else if (typeof formData.expirationDate === 'string') {
      // If it's a string (YYYY-MM-DD), convert to ISO format
      formattedExpirationDate = `${formData.expirationDate}T23:59:59.999Z`;
    }
    console.log('Formatted expiration date:', formattedExpirationDate);
  }

  // Create the final data object with all conversions applied
  const finalData = {
    title: formData.title,
    description: formData.description,
    price: parseFloat(formData.price),
    originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
    categoryId: formData.categoryId,
    platform: formData.platform,
    region: formData.region,
    isRegionLocked: Boolean(formData.isRegionLocked),
    code: formData.code,
    expirationDate: formattedExpirationDate, // Use the formatted date
    supportedLanguages: Array.isArray(formData.supportedLanguages) ? formData.supportedLanguages : [],
    thumbnailUrl: formData.thumbnailUrl,
    autoDelivery: Boolean(formData.autoDelivery),
    tags: Array.isArray(formData.tags) ? formData.tags : [],
    sellerNotes: formData.sellerNotes,
    status: formData.status
  };

  console.log('Final prepared data:', JSON.stringify(finalData, null, 2));
  console.log('Final expirationDate:', finalData.expirationDate);

  return finalData;
};