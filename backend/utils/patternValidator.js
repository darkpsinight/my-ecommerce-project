/**
 * Utility functions for validating product codes against category patterns
 */

/**
 * Validates a code against a set of patterns
 * @param {string} code - The code to validate
 * @param {Array} patterns - Array of pattern objects with regex field
 * @returns {Object} - Result object with isValid and invalidPatterns fields
 */
const validateCodeAgainstPatterns = (code, patterns) => {
  if (!code || !patterns || !Array.isArray(patterns) || patterns.length === 0) {
    return { 
      isValid: false, 
      error: "No patterns available for validation" 
    };
  }

  // Keep track of which patterns were tested
  const invalidPatterns = [];
  
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
        invalidPatterns.push({
          regex: pattern.regex,
          description: pattern.description || 'No description provided'
        });
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
    matchedPatterns: matches
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
