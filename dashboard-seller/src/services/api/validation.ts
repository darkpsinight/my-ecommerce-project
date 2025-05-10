import axios from 'axios';
import { store } from 'src/redux/store';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

// Axios instance with auth header
const getAuthAxios = () => {
  const token = store.getState().auth.token;

  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

export interface Pattern {
  regex: string;
  description: string;
  example: string;
  isActive?: boolean;
}

export interface ValidationPatternsResponse {
  success: boolean;
  data?: {
    patterns: Pattern[];
    categoryId: string;
    platformName: string;
  };
  error?: string;
  message?: string;
}

/**
 * Get validation patterns for a specific category and platform
 */
export const getValidationPatterns = async (
  categoryId: string,
  platformName: string
): Promise<ValidationPatternsResponse> => {
  try {
    const api = getAuthAxios();
    const response = await api.get(
      `/seller/validation-patterns/${categoryId}/${platformName}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching validation patterns:', error);
    if (error.response) {
      return {
        success: false,
        error: error.response.data.error || 'Failed to fetch validation patterns',
        message: error.response.data.message || 'Could not get validation patterns'
      };
    }
    return {
      success: false,
      error: 'Network error',
      message: 'Could not connect to the server to get validation patterns'
    };
  }
};

/**
 * Validate a code against a pattern
 * @param code The code to validate
 * @param pattern The pattern to validate against
 * @returns An object with isValid and reason properties
 */
export const validateCodeAgainstPattern = (
  code: string,
  pattern: Pattern
): { isValid: boolean; reason?: string } => {
  if (!code || !pattern || !pattern.regex) {
    return { isValid: false, reason: 'Missing code or pattern' };
  }

  try {
    const regex = new RegExp(pattern.regex);
    const isValid = regex.test(code);

    if (!isValid) {
      // Try to provide a helpful reason
      if (pattern.description) {
        return {
          isValid: false,
          reason: `Code doesn't match the required format: ${pattern.description}`
        };
      }

      // Check for common issues
      const lengthMatch = pattern.regex.match(/\{(\d+)\}$/);
      if (lengthMatch) {
        const expectedLength = parseInt(lengthMatch[1], 10);
        if (code.length !== expectedLength) {
          return {
            isValid: false,
            reason: `Invalid length: expected ${expectedLength} characters, got ${code.length}`
          };
        }
      }

      // Default reason
      return {
        isValid: false,
        reason: `Code doesn't match the required format for this platform`
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating code against pattern:', error);
    return {
      isValid: false,
      reason: 'Invalid pattern format'
    };
  }
};

/**
 * Convert a regex pattern to an IMask compatible pattern
 * This is a simple conversion that works for basic patterns
 */
export const regexToMask = (pattern: string, example: string): string | RegExp => {
  // For simple alpha-numeric patterns, we can create a mask
  // For more complex patterns, we return the regex directly
  try {
    // If we have an example, use it as a guide
    if (example) {
      return example;
    }

    // Try to build a mask from the regex
    // This is a simplified approach that works for basic patterns
    if (pattern.startsWith('^') && pattern.endsWith('$')) {
      // Remove ^ and $ anchors
      const innerPattern = pattern.substring(1, pattern.length - 1);

      // Common patterns
      if (/^\[A-Z0-9\]\{\d+\}$/.test(innerPattern)) {
        // Pattern like [A-Z0-9]{5}
        const length = innerPattern.match(/\{(\d+)\}/)[1];
        return Array(parseInt(length, 10) + 1).join('*');
      }

      if (/^\[A-Z0-9\]\{(\d+),(\d+)\}$/.test(innerPattern)) {
        // Pattern like [A-Z0-9]{5,10}
        const minLength = innerPattern.match(/\{(\d+),(\d+)\}/)[1];
        return Array(parseInt(minLength, 10) + 1).join('*');
      }
    }

    // Fallback to using the regex directly
    return new RegExp(pattern);
  } catch (error) {
    console.error('Error converting regex to mask:', error);
    // Return a fallback mask
    return '*********************';
  }
};
