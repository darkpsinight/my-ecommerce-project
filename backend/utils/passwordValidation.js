/**
 * Password validation utility functions
 * Implements secure password policies and validation
 */

// Allowed special characters (excluding ambiguous ones)
const ALLOWED_SPECIAL_CHARS = '!@#$%^&*()_+-={}[]:";\',.?~`';

/**
 * Validates password strength and requirements
 * @param {string} password - The password to validate
 * @returns {Object} Validation result with success status and any error messages
 */
const validatePassword = (password) => {
  // Trim whitespace
  const trimmedPassword = password.trim();
  
  const errors = [];

  // Check minimum length (12 characters)
  if (trimmedPassword.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(trimmedPassword)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(trimmedPassword)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for digit
  if (!/\d/.test(trimmedPassword)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special character from allowed set
  const specialCharRegex = new RegExp(`[${ALLOWED_SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
  if (!specialCharRegex.test(trimmedPassword)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for disallowed characters
  const disallowedCharsRegex = /[<>[\]{}|]/;
  if (disallowedCharsRegex.test(trimmedPassword)) {
    errors.push('Password contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
    trimmedPassword
  };
};

/**
 * Generates helpful password requirements message
 * @returns {string} Formatted password requirements message
 */
const getPasswordRequirements = () => {
  return `Password must:
  - Be at least 12 characters long
  - Contain at least one uppercase letter
  - Contain at least one lowercase letter
  - Contain at least one number
  - Contain at least one special character (!@#$%^&*()_+-={}[]:";',.?~\`)
  - Not contain ambiguous characters (<>[]{}|)`;
};

module.exports = {
  validatePassword,
  getPasswordRequirements,
  ALLOWED_SPECIAL_CHARS
}; 