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
  } else {
    errors.title = '';
  }

  if (!formData.description.trim()) {
    errors.description = 'Description is required';
    isValid = false;
  } else if (formData.description.length < 20) {
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

  if (!formData.platform) {
    errors.platform = 'Platform is required';
    isValid = false;
  } else {
    errors.platform = '';
  }

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

  if (!formData.thumbnailUrl) {
    errors.thumbnailUrl = 'Thumbnail URL is required';
    isValid = false;
  } else if (!isValidUrl(formData.thumbnailUrl)) {
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
    platform: '',
    region: '',
    thumbnailUrl: '',
    codes: '',
    newCode: ''
  };

  // Validate all sections
  const { errors: basicErrors, isValid: isBasicValid } = validateBasicInfo(formData, initialErrors);
  const { errors: detailsErrors, isValid: isDetailsValid } = validateProductDetails(
    formData,
    basicErrors
  );
  const { errors: pricingErrors, isValid: isPricingValid } = validatePricing(
    formData,
    detailsErrors
  );
  const { errors: imagesErrors, isValid: isImagesValid } = validateImages(formData, pricingErrors);
  const { errors: codesErrors, isValid: isCodesValid } = validateCodes(formData, imagesErrors);

  const isValid = isBasicValid && isDetailsValid && isPricingValid && isImagesValid && isCodesValid;

  return { errors: codesErrors, isValid };
};
