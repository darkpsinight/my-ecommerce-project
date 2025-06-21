/**
 * Currency utility functions to handle floating-point precision issues in backend
 */

/**
 * Safely multiplies a currency amount with proper precision
 * @param {number} amount - The amount
 * @param {number} multiplier - The multiplier
 * @returns {number} Product with proper precision
 */
const multiplyCurrency = (amount, multiplier) => {
  // Convert to cents to avoid floating-point issues
  const amountInCents = Math.round(amount * 100);
  
  // Multiply and convert back to dollars
  return Math.round(amountInCents * multiplier) / 100;
};

/**
 * Safely calculates the total of an array of currency amounts
 * @param {number[]} amounts - Array of amounts
 * @returns {number} Total with proper precision
 */
const sumCurrency = (amounts) => {
  // Convert all amounts to cents, sum them, and convert back
  const totalInCents = amounts.reduce((sum, amount) => {
    return sum + Math.round(amount * 100);
  }, 0);
  
  return totalInCents / 100;
};

/**
 * Safely adds two currency amounts with proper precision
 * @param {number} a - First amount
 * @param {number} b - Second amount
 * @returns {number} Sum with proper precision
 */
const addCurrency = (a, b) => {
  // Convert to cents to avoid floating-point issues
  const aInCents = Math.round(a * 100);
  const bInCents = Math.round(b * 100);
  
  // Add and convert back to dollars
  return (aInCents + bInCents) / 100;
};

/**
 * Rounds a currency amount to specified decimal places
 * @param {number} amount - The amount to round
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Rounded amount
 */
const roundCurrency = (amount, decimals = 2) => {
  return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

module.exports = {
  multiplyCurrency,
  sumCurrency,
  addCurrency,
  roundCurrency
};