import { FormData, FormErrors } from './types';

/**
 * Validates a URL string
 * @param url The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Validates the basic information step
 * @param formData Current form data
 * @param formErrors Current form errors
 * @returns Updated form errors and validation result
 */
export const validateBasicInfo = (
  formData: FormData,
  formErrors: FormErrors
): { errors: FormErrors; isValid: boolean } => {
  const errors = { ...formErrors };
  let isValid = true;

  if (!formData.title.trim()) {
    errors.title = 'Title is required';
    isValid = false;
  } else if (formData.title.length < 5) {
    errors.title = 'Title must be at least 5 characters';
    isValid = false;
  } else if (formData.title.length > 100) {
    errors.title = 'Title must be less than 100 characters';
    isValid = false;
  } else {
    errors.title = '';
  }

  // Check if description is empty or only contains HTML tags without actual content
  // ReactQuill can return '<p><br></p>' or similar when it's visually empty
  const strippedDescription = formData.description.replace(/<[^>]*>/g, '').trim();
  if (!strippedDescription) {
    errors.description = 'Description is required';
    isValid = false;
  } else if (strippedDescription.length < 20) {
    errors.description = 'Description must be at least 20 characters';
    isValid = false;
  } else {
    errors.description = '';
  }

  return { errors, isValid };
};

/**
 * Validates the product details step
 * @param formData Current form data
 * @param formErrors Current form errors
 * @returns Updated form errors and validation result
 */
export const validateProductDetails = (
  formData: FormData,
  formErrors: FormErrors
): { errors: FormErrors; isValid: boolean } => {
  const errors = { ...formErrors };
  let isValid = true;

  if (!formData.region) {
    errors.region = 'Region is required';
    isValid = false;
  } else {
    errors.region = '';
  }

  return { errors, isValid };
};

/**
 * Validates the pricing step
 * @param formData Current form data
 * @param formErrors Current form errors
 * @returns Updated form errors and validation result
 */
export const validatePricing = (
  formData: FormData,
  formErrors: FormErrors
): { errors: FormErrors; isValid: boolean } => {
  const errors = { ...formErrors };
  let isValid = true;

  if (!formData.price) {
    errors.price = 'Price is required';
    isValid = false;
  } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
    errors.price = 'Price must be a positive number';
    isValid = false;
  } else {
    errors.price = '';
  }

  if (
    formData.originalPrice &&
    (isNaN(parseFloat(formData.originalPrice)) ||
      parseFloat(formData.originalPrice) <= 0)
  ) {
    errors.price = 'Original price must be a positive number';
    isValid = false;
  }

  return { errors, isValid };
};

/**
 * Validates the images step
 * @param formData Current form data
 * @param formErrors Current form errors
 * @returns Updated form errors and validation result
 */
export const validateImages = (
  formData: FormData,
  formErrors: FormErrors
): { errors: FormErrors; isValid: boolean } => {
  const errors = { ...formErrors };
  let isValid = true;

  // Make thumbnail URL validation match Create Listing Modal
  // Only validate if URL is provided, but don't require it
  if (formData.thumbnailUrl && !isValidUrl(formData.thumbnailUrl)) {
    errors.thumbnailUrl = 'Please enter a valid URL';
    isValid = false;
  } else {
    errors.thumbnailUrl = '';
  }

  return { errors, isValid };
};

/**
 * Validates the codes step
 * @param formData Current form data
 * @param formErrors Current form errors
 * @returns Updated form errors and validation result
 */
export const validateCodes = (
  formData: FormData,
  formErrors: FormErrors
): { errors: FormErrors; isValid: boolean } => {
  const errors = { ...formErrors };
  let isValid = true;

  if (!formData.codes || formData.codes.length === 0) {
    errors.codes = 'At least one product code is required';
    isValid = false;
  } else {
    errors.codes = '';
  }

  return { errors, isValid };
};

/**
 * Validates the entire form
 * @param formData Current form data
 * @returns Form errors and validation result
 */
export const validateForm = (formData: FormData): { errors: FormErrors; isValid: boolean } => {
  const initialErrors: FormErrors = {
    title: '',
    description: '',
    price: '',
    region: '',
    thumbnailUrl: '',
    codes: '',
    newCode: ''
  };

  // Validate each section independently to collect all errors
  const { errors: basicErrors, isValid: isBasicValid } = validateBasicInfo(formData, { ...initialErrors });
  const { errors: detailsErrors, isValid: isDetailsValid } = validateProductDetails(formData, { ...initialErrors });
  const { errors: pricingErrors, isValid: isPricingValid } = validatePricing(formData, { ...initialErrors });
  const { errors: imagesErrors, isValid: isImagesValid } = validateImages(formData, { ...initialErrors });
  const { errors: codesErrors, isValid: isCodesValid } = validateCodes(formData, { ...initialErrors });

  // Combine all errors from different sections
  const combinedErrors: FormErrors = {
    title: basicErrors.title,
    description: basicErrors.description,
    price: pricingErrors.price,
    region: detailsErrors.region,
    thumbnailUrl: imagesErrors.thumbnailUrl,
    codes: codesErrors.codes,
    newCode: codesErrors.newCode
  };

  const isValid = isBasicValid && isDetailsValid && isPricingValid && isImagesValid && isCodesValid;

  // Return the combined errors from all validation steps
  // This ensures all validation errors are displayed at once
  return { errors: combinedErrors, isValid };
};
