import { useState } from 'react';
import { createListing, checkCodeExists } from 'src/services/api/listings';
import { validateListingForm, prepareFormDataForSubmission } from '../../ValidationHelpers';
import { getValidationPatterns, Pattern, validateCodeAgainstPattern } from 'src/services/api/validation';
import { Category } from '../types';

/**
 * Hook to manage form handlers
 */
export const useFormHandlers = ({
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
}) => {
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Handle form field changes
  const handleChange = (e) => {
    // Check if this is a multi-field update
    if ('fields' in e && e.fields) {
      // Update multiple fields at once
      setFormData((prev) => ({
        ...prev,
        ...e.fields
      }));

      // Clear errors for all updated fields
      const errorUpdates = {};
      Object.keys(e.fields).forEach(fieldName => {
        errorUpdates[fieldName] = '';
      });

      setFormErrors((prev) => ({
        ...prev,
        ...errorUpdates
      }));

      // Special handling for category changes
      if ('categoryId' in e.fields) {
        const categoryId = e.fields.categoryId;
        const category = categories.find((cat) => cat._id === categoryId);
        setSelectedCategory(category || null);

        // Update available platforms
        if (category && category.platforms) {
          const platforms = category.platforms
            .filter((platform) => platform.isActive !== false)
            .map((platform) => platform.name);
          setAvailablePlatforms(platforms);
        } else {
          setAvailablePlatforms([]);
        }
      }

      // Special handling for platform changes
      if ('platform' in e.fields && formData.categoryId && e.fields.platform) {
        fetchValidationPatterns(formData.categoryId, e.fields.platform);
      }

      return;
    }

    // Handle single field update (original behavior)
    if ('target' in e) {
      const { name, value } = e.target;
      let newValue = value;

      // Handle checkbox values
      if (e.target.type === 'checkbox') {
        newValue = e.target.checked;
      }

      // If changing category, update available platforms
      if (name === 'categoryId') {
        // Find the selected category from the categories array
        const category = categories.find((cat) => cat._id === value);

        setSelectedCategory(category || null);

        // Reset platform when category changes
        setFormData((prev) => ({
          ...prev,
          [name]: newValue,
          platform: ''
        }));

        setFormErrors((prev) => ({
          ...prev,
          [name]: ''
        }));

        // Update available platforms
        if (category && category.platforms) {
          const platforms = category.platforms
            .filter((platform) => platform.isActive !== false)
            .map((platform) => platform.name);
          setAvailablePlatforms(platforms);
        } else {
          setAvailablePlatforms([]);
        }
      }
      // If changing platform, fetch validation patterns
      else if (name === 'platform') {
        setFormData((prev) => ({
          ...prev,
          [name]: newValue
        }));

        setFormErrors((prev) => ({
          ...prev,
          [name]: ''
        }));

        // Fetch validation patterns for the selected category and platform
        if (formData.categoryId && newValue) {
          fetchValidationPatterns(formData.categoryId, newValue);
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: newValue
        }));

        setFormErrors((prev) => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  // Handle input blur events for field validation
  const handleBlur = (e) => {
    const { name, value } = e.target;

    // Validate specific fields on blur
    if (name === 'thumbnailUrl' && value) {
      try {
        new URL(value);
        // Valid URL, clear error
        setFormErrors((prev) => ({
          ...prev,
          [name]: ''
        }));
      } catch (error) {
        // Invalid URL, set error
        setFormErrors((prev) => ({
          ...prev,
          [name]: 'Please enter a valid URL'
        }));
      }
    }
  };

  // Validate the entire form
  const validateForm = () => {
    const { errors, isValid } = validateListingForm(formData);
    setFormErrors(errors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setValidationError(null);
      setError(null);

      // Prepare form data for submission
      const submitData: any = prepareFormDataForSubmission(formData);

      // If we have codes, use the first code for backward compatibility
      if (formData.codes && formData.codes.length > 0) {
        const firstCode = formData.codes[0];
        submitData.code = firstCode.code;

        // If the first code has an expiration date, format it as ISO 8601
        if (firstCode.expirationDate) {
          // Check if it's a Date object
          if (firstCode.expirationDate instanceof Date) {
            submitData.codeExpirationDate = firstCode.expirationDate.toISOString();
          } else if (typeof firstCode.expirationDate === 'string') {
            // Check if it already contains 'T' (already in ISO format)
            if (firstCode.expirationDate.includes('T')) {
              submitData.codeExpirationDate = firstCode.expirationDate;
            } else {
              // Convert YYYY-MM-DD to ISO format
              submitData.codeExpirationDate = `${firstCode.expirationDate}T23:59:59.999Z`;
            }
          }
        }

        // If there are multiple codes, add them as an array
        if (formData.codes.length > 1) {
          submitData.additionalCodes = formData.codes.slice(1).map(codeItem => {
            const codeData: any = { code: codeItem.code };

            if (codeItem.expirationDate) {
              // Check if it's a Date object
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
      }

      const response = await createListing(submitData);

      // Define a type for the response details with invalidCodes
      interface ResponseDetails {
        invalidCodes?: Array<{ index: number; code: string; errors?: any[] }>;
        invalidPatterns?: Array<{ regex: string; description?: string }>;
        platform?: string;
        category?: string;
      }

      if (response.success) {
        onSubmit(response);
        // Explicitly close the modal after successful submission
        onClose();
      } else {
        // Check for code validation errors
        const details = response.details as ResponseDetails;
        if (details && details.invalidCodes && details.invalidCodes.length > 0) {
          // Mark the invalid codes in the UI
          const updatedCodes = [...formData.codes];
          const invalidCodes = details.invalidCodes;
          const invalidCodeIndices = new Set(invalidCodes.map(ic => ic.index));

          // Update the codes array to mark invalid codes
          updatedCodes.forEach((codeItem, index) => {
            if (invalidCodeIndices.has(index)) {
              const invalidCodeInfo = invalidCodes.find(ic => ic.index === index);
              codeItem.isInvalid = true;
              codeItem.invalidReason = `This code doesn't match the pattern for ${details.platform || 'this platform'}`;
            }
          });

          // Update form data with marked invalid codes
          setFormData(prev => ({
            ...prev,
            codes: updatedCodes
          }));

          setValidationError(
            `One or more codes don't match the required format for ${details.platform || 'this platform'}. Please remove or correct the highlighted codes.`
          );
        } else if (details && details.invalidPatterns) {
          const invalidPatternsInfo = details.invalidPatterns
            .map((pattern) => pattern.description || pattern.regex)
            .join(', ');

          setValidationError(
            `Code doesn't match the required format: ${invalidPatternsInfo}`
          );

          setFormErrors((prev) => ({
            ...prev,
            newCode: `Invalid format for ${details.platform || ''} on ${details.category || ''}`
          }));
        } else {
          setError(
            response.message || 'Failed to create listing. Please try again.'
          );
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch validation patterns for the selected category and platform
  const fetchValidationPatterns = async (
    categoryId: string,
    platformName: string
  ) => {
    if (!categoryId || !platformName) return;

    try {
      setPatternLoading(true);
      setValidationError(null);
      const response = await getValidationPatterns(categoryId, platformName);

      if (response && response.success && response.data) {
        const { patterns: responsePatterns } = response.data;
        setPatterns(responsePatterns);

        // If there's only one pattern, select it automatically
        let newSelectedPattern = null;
        if (responsePatterns.length === 1) {
          newSelectedPattern = responsePatterns[0];
          setSelectedPattern(newSelectedPattern);
        } else {
          setSelectedPattern(null);
        }

        // Validate existing codes against the new pattern
        if (newSelectedPattern && formData.codes.length > 0) {
          const updatedCodes = formData.codes.map(codeItem => {
            // Create a new object to avoid mutating the original
            const updatedItem = { ...codeItem };

            // Validate the code against the new pattern
            const validationResult = validateCodeAgainstPattern(codeItem.code, newSelectedPattern);

            if (!validationResult.isValid) {
              updatedItem.isInvalid = true;
              updatedItem.invalidReason = validationResult.reason;
            } else {
              // Clear any previous invalid status
              updatedItem.isInvalid = false;
              updatedItem.invalidReason = undefined;
            }

            return updatedItem;
          });

          // Update form data with validated codes
          setFormData(prev => ({
            ...prev,
            codes: updatedCodes
          }));
        }
      } else {
        setError(
          'Failed to load validation patterns: ' +
            (response.message || 'Unknown error')
        );
      }
    } catch (err) {
      console.error('Error fetching validation patterns:', err);
      setError('Failed to load validation patterns. Please try again.');
    } finally {
      setPatternLoading(false);
    }
  };

  // Handle date change for the DatePicker component
  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      newExpirationDate: date
    }));
  };

  // Handle adding a new code with optional expiration date
  const handleAddCode = async () => {
    // Validate the code
    if (!formData.newCode.trim()) {
      setFormErrors(prev => ({ ...prev, newCode: 'Please enter a code' }));
      return;
    }

    // Check if code already exists in the current form
    if (formData.codes.some(c => c.code === formData.newCode.trim())) {
      setFormErrors(prev => ({ ...prev, newCode: 'This code already exists in this listing' }));
      return;
    }

    // Check if code exists in the database
    try {
      // Show loading state
      setFormErrors(prev => ({ ...prev, newCode: 'Checking code...' }));

      const result = await checkCodeExists(formData.newCode.trim());

      if (result.exists) {
        // Check if it's a duplicate within the same batch
        if (result.listing.isSameBatch) {
          setFormErrors(prev => ({
            ...prev,
            newCode: `This code is a duplicate within the current batch`
          }));
        }
        // Check if it's a duplicate within the same listing
        else if (result.listing.inSameListing) {
          setFormErrors(prev => ({
            ...prev,
            newCode: `This code already exists in this listing`
          }));
        }
        else {
          // Code exists in another listing
          setFormErrors(prev => ({
            ...prev,
            newCode: `This code already exists in another listing: ${result.listing.title}`
          }));
        }
        return;
      }

      // Clear the checking message
      setFormErrors(prev => ({ ...prev, newCode: '' }));
    } catch (error) {
      console.error('Error checking if code exists:', error);
      // Continue with adding the code even if the check fails
      // This is a fallback in case the API is down
    }

    // Create the new code item
    const newCodeItem = {
      code: formData.newCode.trim(),
      expirationDate: formData.newExpirationDate
    };

    // Get the currently selected pattern from the context
    const currentPattern = selectedPattern;

    // Validate against the selected pattern if available
    if (currentPattern && currentPattern.regex) {
      const validationResult = validateCodeAgainstPattern(newCodeItem.code, currentPattern);

      if (!validationResult.isValid) {
        // Add the code but mark it as invalid
        newCodeItem['isInvalid'] = true;
        newCodeItem['invalidReason'] = validationResult.reason;
      }
    }

    // Add the new code to the codes array
    const updatedCodes = [
      ...formData.codes,
      newCodeItem
    ];

    // Update form data
    setFormData(prev => ({
      ...prev,
      codes: updatedCodes,
      newCode: '',
      newExpirationDate: null
    }));

    // Clear errors
    setFormErrors(prev => ({ ...prev, newCode: '', codes: '' }));
  };

  // Handle deleting a code
  const handleDeleteCode = (codeToDelete: string) => {
    const updatedCodes = formData.codes.filter(c => c.code !== codeToDelete);

    setFormData(prev => ({
      ...prev,
      codes: updatedCodes
    }));
  };

  // Handle keydown events for the code input
  const handleCodeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleAddCode(); // Use void to handle the Promise without awaiting
    }
  };

  return {
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
  };
};
