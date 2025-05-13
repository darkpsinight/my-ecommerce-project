/**
 * Utility for formatting standardized error responses
 * 
 * This module provides functions to create consistent error responses
 * across all API endpoints, particularly for validation errors.
 */

/**
 * Creates a standardized validation error response
 * 
 * @param {string} message - Main error message
 * @param {Array} errors - Array of error objects
 * @param {Object} context - Additional context information
 * @returns {Object} Formatted error response
 */
const createValidationErrorResponse = (message, errors, context = {}) => {
  return {
    success: false,
    message: message || 'Validation failed',
    errors: errors || [],
    context: context
  };
};

/**
 * Creates a standardized error object for the errors array
 * 
 * @param {string} type - Error type (e.g., 'duplicate', 'invalid_pattern')
 * @param {string} code - The masked code with the error
 * @param {string} details - Detailed error description
 * @param {string} suggestion - Suggested action to fix the error
 * @param {Object} additionalInfo - Any additional information about the error
 * @returns {Object} Formatted error object
 */
const createErrorObject = (type, code, details, suggestion, additionalInfo = {}) => {
  return {
    type,
    code,
    details,
    suggestion,
    ...additionalInfo
  };
};

/**
 * Formats duplicate code errors (within CSV or with existing listings)
 * 
 * @param {Array} duplicateCodes - Array of duplicate codes
 * @param {string} duplicateType - Type of duplication ('csv', 'existing_listing', 'current_listing')
 * @param {Array} additionalInfo - Additional information about duplicates (e.g., listing titles)
 * @returns {Array} Formatted error objects
 */
const formatDuplicateErrors = (duplicateCodes, duplicateType, additionalInfo = []) => {
  const errorType = 'duplicate';
  let detailsPrefix = '';
  let suggestion = '';
  
  switch (duplicateType) {
    case 'csv':
      detailsPrefix = 'Duplicate code found within the CSV file';
      suggestion = 'Remove or edit the duplicate code in your CSV file';
      break;
    case 'existing_listing':
      detailsPrefix = 'Code already exists in another listing';
      suggestion = 'Use a different code that is not already in use';
      break;
    case 'current_listing':
      detailsPrefix = 'Code already exists in this listing';
      suggestion = 'Remove this duplicate code as it is already in your listing';
      break;
    default:
      detailsPrefix = 'Duplicate code found';
      suggestion = 'Remove or edit the duplicate code';
  }
  
  return duplicateCodes.map((code, index) => {
    // Handle both string codes and object codes
    const codeValue = typeof code === 'string' ? code : code.code;
    let details = detailsPrefix;
    
    // Add additional context if available (for existing_listing type)
    if (duplicateType === 'existing_listing' && additionalInfo[index]) {
      const info = additionalInfo[index];
      if (info.listingTitle) {
        details += ` (in listing: "${info.listingTitle}")`;
      }
    }
    
    return createErrorObject(
      errorType,
      codeValue,
      details,
      suggestion,
      // Include any additional info as extra properties
      duplicateType === 'existing_listing' && additionalInfo[index] 
        ? { listingInfo: additionalInfo[index] } 
        : {}
    );
  });
};

/**
 * Formats pattern validation errors
 * 
 * @param {Array} invalidCodes - Array of invalid codes with their errors
 * @returns {Array} Formatted error objects
 */
const formatPatternErrors = (invalidCodes) => {
  return invalidCodes.map(invalidCode => {
    const errors = invalidCode.errors || [];
    const primaryError = errors[0] || {};
    
    let details = 'Code format is invalid';
    if (primaryError.reason) {
      details += `: ${primaryError.reason}`;
    }
    
    let suggestion = 'Ensure the code matches the required format';
    if (primaryError.expected) {
      suggestion += `: ${primaryError.expected}`;
    }
    
    return createErrorObject(
      'invalid_pattern',
      invalidCode.code,
      details,
      suggestion,
      { validationErrors: errors }
    );
  });
};

module.exports = {
  createValidationErrorResponse,
  createErrorObject,
  formatDuplicateErrors,
  formatPatternErrors
};
