import { useState } from 'react';
import { createListing } from 'src/services/api/listings';
import { validateListingForm, prepareFormDataForSubmission } from '../../ValidationHelpers';
import { getValidationPatterns, Pattern } from 'src/services/api/validation';
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
      const submitData = prepareFormDataForSubmission(formData);
      
      // Force the expirationDate to be in ISO format if it exists
      if (formData.expirationDate) {
        // This ensures the date is properly formatted as ISO 8601
        submitData.expirationDate = `${formData.expirationDate}T23:59:59.999Z`;
      }

      const response = await createListing(submitData);

      if (response.success) {
        onSubmit(response);
        // Explicitly close the modal after successful submission
        onClose();
      } else {
        // Check for code validation errors
        if (response.details && response.details.invalidPatterns) {
          const invalidPatternsInfo = response.details.invalidPatterns
            .map((pattern) => pattern.description || pattern.regex)
            .join(', ');

          setValidationError(
            `Code doesn't match the required format: ${invalidPatternsInfo}`
          );

          setFormErrors((prev) => ({
            ...prev,
            code: `Invalid format for ${response.details.platform} on ${response.details.category}`
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
        if (responsePatterns.length === 1) {
          setSelectedPattern(responsePatterns[0]);
        } else {
          setSelectedPattern(null);
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

  return {
    handleChange,
    handleBlur,
    validateForm,
    handleSubmit,
    submitting,
    setSubmitting
  };
};
