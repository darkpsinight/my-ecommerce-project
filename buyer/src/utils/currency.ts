/**
 * Currency utility functions to handle floating-point precision issues
 */

/**
 * Formats a number as currency with proper precision
 * @param amount - The amount to format
 * @param currency - The currency symbol (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = '$',
  decimals: number = 2
): string => {
  // Handle edge cases
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${currency}0.00`;
  }

  // Round to specified decimal places to avoid floating-point precision issues
  const roundedAmount = Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
  
  return `${currency}${roundedAmount.toFixed(decimals)}`;
};

/**
 * Safely adds two currency amounts with proper precision
 * @param a - First amount
 * @param b - Second amount
 * @returns Sum with proper precision
 */
export const addCurrency = (a: number, b: number): number => {
  // Convert to cents to avoid floating-point issues
  const aInCents = Math.round(a * 100);
  const bInCents = Math.round(b * 100);
  
  // Add and convert back to dollars
  return (aInCents + bInCents) / 100;
};

/**
 * Safely multiplies a currency amount with proper precision
 * @param amount - The amount
 * @param multiplier - The multiplier
 * @returns Product with proper precision
 */
export const multiplyCurrency = (amount: number, multiplier: number): number => {
  // Convert to cents to avoid floating-point issues
  const amountInCents = Math.round(amount * 100);
  
  // Multiply and convert back to dollars
  return Math.round(amountInCents * multiplier) / 100;
};

/**
 * Safely calculates the total of an array of currency amounts
 * @param amounts - Array of amounts
 * @returns Total with proper precision
 */
export const sumCurrency = (amounts: number[]): number => {
  // Convert all amounts to cents, sum them, and convert back
  const totalInCents = amounts.reduce((sum, amount) => {
    return sum + Math.round(amount * 100);
  }, 0);
  
  return totalInCents / 100;
};

/**
 * Rounds a currency amount to specified decimal places
 * @param amount - The amount to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded amount
 */
export const roundCurrency = (amount: number, decimals: number = 2): number => {
  return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Formats a price without currency symbol (for display purposes)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted price string
 */
export const formatPrice = (amount: number, decimals: number = 2): string => {
  // Handle edge cases
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0.00';
  }

  // Round to specified decimal places to avoid floating-point precision issues
  const roundedAmount = Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
  
  return roundedAmount.toFixed(decimals);
};