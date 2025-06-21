// Simple test to verify currency utilities work correctly
const { formatCurrency, formatPrice, multiplyCurrency, sumCurrency } = require('./currency.ts');

// Test the exact scenario described: $5.58 * 3 = $16.74
console.log('Testing currency utilities...');

const price = 5.58;
const quantity = 3;

// Test JavaScript floating point issue
const jsResult = price * quantity;
console.log(`JavaScript result: $${jsResult} (${jsResult})`);

// Test our utility function
const utilityResult = multiplyCurrency(price, quantity);
console.log(`Utility result: $${utilityResult} (${utilityResult})`);

// Test formatting
const formattedResult = formatPrice(utilityResult);
console.log(`Formatted result: $${formattedResult}`);

// Test with currency formatting
const currencyResult = formatCurrency(utilityResult);
console.log(`Currency formatted result: ${currencyResult}`);

// Test array summing
const items = [
  { price: 5.58, quantity: 3 },
  { price: 2.99, quantity: 2 },
  { price: 10.50, quantity: 1 }
];

const itemTotals = items.map(item => multiplyCurrency(item.price, item.quantity));
const total = sumCurrency(itemTotals);

console.log('\nTesting cart with multiple items:');
items.forEach((item, index) => {
  const itemTotal = multiplyCurrency(item.price, item.quantity);
  console.log(`Item ${index + 1}: $${item.price} × ${item.quantity} = $${formatPrice(itemTotal)}`);
});
console.log(`Total: $${formatPrice(total)}`);

console.log('\nCurrency utilities test completed!');