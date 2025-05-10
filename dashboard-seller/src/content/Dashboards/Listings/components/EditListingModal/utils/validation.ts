import { Pattern } from 'src/services/api/validation';

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
