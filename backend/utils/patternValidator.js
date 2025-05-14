/**
 * Utility functions for validating product codes against category patterns
 */

/**
 * Analyzes why a code doesn't match a pattern and provides detailed error reasons
 * @param {string} code - The code to validate
 * @param {Object} pattern - Pattern object with regex field
 * @returns {Array} - Array of specific error reasons
 */
const getDetailedValidationErrors = (code, pattern) => {
  const errors = [];

  // Skip processing if no code or pattern
  if (!code || !pattern || !pattern.regex) {
    return [{ reason: "Missing code or pattern" }];
  }

  // Check for spaces in the code
  if (code.includes(' ')) {
    errors.push({
      reason: "Contains spaces",
      expected: "No spaces",
      actual: "Contains spaces",
      message: "Spaces are not allowed in codes"
    });
    return errors; // Return immediately as this is a critical error
  }

  try {
    // Extract length constraints from regex if it has a specific length requirement
    let lengthRequirement = null;
    const lengthMatch = pattern.regex.match(/\{(\d+)\}$/); // Matches {n} at the end
    if (lengthMatch) {
      lengthRequirement = parseInt(lengthMatch[1]);
    }

    // Check length
    if (lengthRequirement && code.length !== lengthRequirement) {
      errors.push({
        reason: "Invalid length",
        expected: `${lengthRequirement} characters`,
        actual: `${code.length} characters`
      });
    }

    // Check for character case issues
    if (pattern.regex.includes('A-Z') && !/[A-Z]/.test(code) && /[a-z]/.test(code)) {
      errors.push({
        reason: "Invalid character case",
        expected: "Uppercase letters (A-Z)",
        actual: "Contains lowercase letters"
      });
    }

    // Check for numeric characters if required
    if (pattern.regex.includes('0-9') && !/[0-9]/.test(code)) {
      errors.push({
        reason: "Missing required characters",
        expected: "Numbers (0-9)",
        actual: "No numeric characters found"
      });
    }

    // Check for required separators (like hyphens in XX-XX-XX patterns)
    if (pattern.regex.includes('\\-') || pattern.regex.includes('-')) {
      const hasDashes = code.includes('-');
      const expectedDashCount = (pattern.example?.match(/-/g) || []).length;
      const actualDashCount = (code.match(/-/g) || []).length;

      if (expectedDashCount > 0 && !hasDashes) {
        errors.push({
          reason: "Missing separators",
          expected: `Format with ${expectedDashCount} hyphens (e.g., ${pattern.example})`,
          actual: "No hyphens found"
        });
      } else if (expectedDashCount > 0 && actualDashCount !== expectedDashCount) {
        errors.push({
          reason: "Incorrect separator count",
          expected: `${expectedDashCount} hyphens`,
          actual: `${actualDashCount} hyphens`
        });
      }
    }

    // If no specific errors identified but still invalid, provide a fallback error
    if (errors.length === 0) {
      const readableFormat = pattern.description ||
                          (pattern.example ? `Example: ${pattern.example}` : pattern.regex);
      errors.push({
        reason: "Invalid format",
        expected: readableFormat,
        actual: "Doesn't match required pattern"
      });
    }

  } catch (error) {
    console.error("Error analyzing validation failures:", error);
    errors.push({
      reason: "Validation error",
      message: "An error occurred during detailed validation"
    });
  }

  return errors;
};

/**
 * Validates a code against a set of patterns
 * @param {string} code - The code to validate
 * @param {Array} patterns - Array of pattern objects with regex field
 * @returns {Object} - Result object with isValid and detailed validation errors
 */
const validateCodeAgainstPatterns = (code, patterns) => {
  if (!code || !patterns || !Array.isArray(patterns) || patterns.length === 0) {
    return {
      isValid: false,
      error: "No patterns available for validation",
      validationErrors: [{
        reason: "No validation patterns",
        message: "No patterns are available to validate this code"
      }]
    };
  }

  // Check for spaces in the code first
  if (code.includes(' ')) {
    return {
      isValid: false,
      error: "Spaces not allowed in codes",
      validationErrors: [{
        reason: "Contains spaces",
        message: "Spaces are not allowed in codes",
        expected: "No spaces",
        actual: "Contains spaces"
      }]
    };
  }

  // Keep track of which patterns were tested
  const invalidPatterns = [];
  const validationErrors = [];

  // Special case: If there are patterns but they're all empty or inactive,
  // we'll consider any code valid (no validation required)
  const hasOnlyEmptyPatterns = patterns.every(pattern =>
    !pattern.regex || pattern.regex.trim() === '' || pattern.isActive === false
  );

  if (hasOnlyEmptyPatterns) {
    return {
      isValid: true,
      invalidPatterns: [],
      matchedPatterns: [],
      message: "No pattern validation required"
    };
  }

  // Check the code against each pattern
  const matches = patterns.filter(pattern => {
    // Skip empty regex patterns or inactive patterns
    if (!pattern.regex || pattern.regex.trim() === '' || !pattern.isActive) {
      return false;
    }

    try {
      const regexPattern = new RegExp(pattern.regex);
      const isMatch = regexPattern.test(code);

      if (!isMatch) {
        // Store basic pattern info
        invalidPatterns.push({
          regex: pattern.regex,
          description: pattern.description || 'No description provided'
        });

        // Get detailed validation errors for this pattern
        const errors = getDetailedValidationErrors(code, pattern);
        if (errors.length > 0) {
          validationErrors.push(...errors);
        }
      }

      return isMatch;
    } catch (error) {
      // If regex is invalid, log it and continue
      console.error(`Invalid regex pattern: ${pattern.regex}`, error);
      return false;
    }
  });

  return {
    isValid: matches.length > 0,
    invalidPatterns: invalidPatterns,
    matchedPatterns: matches,
    validationErrors: validationErrors
  };
};

/**
 * Finds appropriate patterns for a subcategory in a category
 * @param {string} categoryId - Category ID
 * @param {string} platformName - Platform/subcategory name
 * @param {Object} categoryModel - Mongoose Category model
 * @returns {Promise<Array>} - Array of pattern objects
 */
const getPatternsForPlatform = async (categoryId, platformName, categoryModel) => {
  try {
    const category = await categoryModel.findById(categoryId);

    if (!category) {
      return { error: "Category not found" };
    }

    const platform = category.platforms.find(p =>
      p.name.toLowerCase() === platformName.toLowerCase() && p.isActive
    );

    if (!platform) {
      return { error: "Platform not found in category" };
    }

    // If no patterns are defined at all, return empty set but don't treat as error
    if (!platform.patterns) {
      platform.patterns = [];
    }

    // Even with empty patterns, we'll return success as this is valid now

    return {
      patterns: platform.patterns.filter(p => p.isActive !== false),
      platform: platform.name,
      category: category.name
    };
  } catch (error) {
    console.error("Error fetching patterns:", error);
    return { error: "Error fetching patterns" };
  }
};

module.exports = {
  validateCodeAgainstPatterns,
  getPatternsForPlatform
};
