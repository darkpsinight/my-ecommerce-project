/**
 * Format product code based on pattern
 * @param value The raw code value
 * @param pattern The pattern to format against
 * @returns The formatted code
 */
export const formatProductCode = (value: string, pattern: any): string => {
  if (!pattern || !pattern.example) {
    return value;
  }

  try {
    // Remove spaces and existing dashes
    let formattedValue = value.replace(/\s/g, '').replace(/-/g, '');
    let finalValue = formattedValue;
    const example = pattern.example;

    if (example.includes('-')) {
      // Get dash positions from the example
      const dashPositions: number[] = [];
      let exampleWithoutDashes = '';

      for (let i = 0; i < example.length; i++) {
        if (example[i] === '-') {
          // Store the position in the string without dashes
          dashPositions.push(exampleWithoutDashes.length);
        } else {
          exampleWithoutDashes += example[i];
        }
      }

      // Apply dashes at the correct positions
      finalValue = '';
      let dashesAdded = 0;

      for (let i = 0; i < formattedValue.length; i++) {
        // Check if we need to add a dash before this character
        if (dashPositions.includes(i)) {
          finalValue += '-';
          dashesAdded++;
        }
        finalValue += formattedValue[i];
      }

      return finalValue;
    }

    return formattedValue;
  } catch (error) {
    console.error('Error applying code formatting:', error);
    return value;
  }
};
