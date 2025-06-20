

/**
 * Interface for a code item
 */
export interface CodeItem {
  code: string;
  expirationDate: string | Date | null;
}

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
  codes: CodeItem[];
  newCode: string;
  newExpirationDate: string | Date | null;
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
  newCode: string;
  codes: string;
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
    newCode: '',
    codes: '',
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
  // Strip HTML tags to get the actual text content
  const strippedDescription = formData.description.replace(/<[^>]*>/g, '').trim();
  if (!strippedDescription) {
    errors.description = 'Description is required';
    isValid = false;
  } else if (strippedDescription.length < 20) {
    errors.description = 'Description must be at least 20 characters';
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
  if (!formData.codes || formData.codes.length === 0) {
    errors.codes = 'At least one product code is required';
    isValid = false;
  } else {
    // Check for duplicate codes
    const codeMap = new Map();
    const duplicates = new Set<string>();

    formData.codes.forEach(codeItem => {
      const code = codeItem.code;
      if (codeMap.has(code)) {
        duplicates.add(code);
      } else {
        codeMap.set(code, true);
      }
    });

    if (duplicates.size > 0) {
      const duplicatesList = Array.from(duplicates).slice(0, 3).join(', ');
      const additionalCount = duplicates.size > 3 ? ` and ${duplicates.size - 3} more` : '';
      errors.codes = `Duplicate codes found: ${duplicatesList}${additionalCount}. Please remove duplicates before submitting.`;
      isValid = false;
    }
  }

  // Thumbnail URL validation - now required
  if (!formData.thumbnailUrl || !formData.thumbnailUrl.trim()) {
    errors.thumbnailUrl = 'Product thumbnail is required';
    isValid = false;
  } else if (!isValidUrl(formData.thumbnailUrl)) {
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
  console.log('Original form data:', JSON.stringify(formData, null, 2));

  // Extract the first code for backward compatibility
  let firstCode = '';
  let firstCodeExpirationDate = undefined;

  if (formData.codes && formData.codes.length > 0) {
    const firstCodeItem = formData.codes[0];
    firstCode = firstCodeItem.code;

    // Format expirationDate as ISO date-time string if it exists
    if (firstCodeItem.expirationDate) {
      if (firstCodeItem.expirationDate instanceof Date) {
        // If it's a Date object, format it to ISO string
        firstCodeExpirationDate = firstCodeItem.expirationDate.toISOString();
      } else if (typeof firstCodeItem.expirationDate === 'string') {
        // If it's a string, check if it already contains 'T' (already in ISO format)
        if (firstCodeItem.expirationDate.includes('T')) {
          firstCodeExpirationDate = firstCodeItem.expirationDate;
        } else {
          // Convert YYYY-MM-DD to ISO format
          firstCodeExpirationDate = `${firstCodeItem.expirationDate}T23:59:59.999Z`;
        }
      }
    }
  }

  // Create the final data object with all conversions applied
  const finalData: any = {
    title: formData.title,
    description: formData.description,
    price: parseFloat(formData.price),
    originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
    categoryId: formData.categoryId,
    platform: formData.platform,
    region: formData.region,
    isRegionLocked: Boolean(formData.isRegionLocked),
    code: firstCode,
    codeExpirationDate: firstCodeExpirationDate, // Use the formatted date for the first code
    supportedLanguages: Array.isArray(formData.supportedLanguages) ? formData.supportedLanguages : [],
    thumbnailUrl: formData.thumbnailUrl,
    autoDelivery: Boolean(formData.autoDelivery),
    tags: Array.isArray(formData.tags) ? formData.tags : [],
    sellerNotes: formData.sellerNotes,
    status: formData.status
  };

  // Add additional codes if there are more than one
  if (formData.codes && formData.codes.length > 1) {
    finalData.additionalCodes = formData.codes.slice(1).map(codeItem => {
      const codeData: any = { code: codeItem.code };

      if (codeItem.expirationDate) {
        if (codeItem.expirationDate instanceof Date) {
          codeData.expirationDate = codeItem.expirationDate.toISOString();
        } else if (typeof codeItem.expirationDate === 'string') {
          // Check if it already contains 'T' (already in ISO format)
          if (codeItem.expirationDate.includes('T')) {
            codeData.expirationDate = codeItem.expirationDate;
          } else {
            // Convert YYYY-MM-DD to ISO format
            codeData.expirationDate = `${codeItem.expirationDate}T23:59:59.999Z`;
          }
        }
      }

      return codeData;
    });
  }

  console.log('Final prepared data:', JSON.stringify(finalData, null, 2));
  console.log('Final codeExpirationDate:', finalData.codeExpirationDate);

  return finalData;
};