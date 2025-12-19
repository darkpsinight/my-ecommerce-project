const StripeAdapter = require("../services/payment/stripeAdapter");

// Mock config
const config = {
    secretKey: "sk_test_mock",
    apiVersion: "2023-10-16"
};

const adapter = new StripeAdapter(config);

function testCalculation(targetAmount, expectedGross) {
    const result = adapter.calculateGrossAmount(targetAmount);
    const passed = result.grossAmountCents === expectedGross;

    console.log(`Target: $${targetAmount / 100}`);
    console.log(`Calculated Gross: $${result.grossAmountCents / 100}`);
    console.log(`Stripe Fee: $${result.stripeFeeCents / 100}`);
    console.log(`Net: $${result.netAmountCents / 100}`);
    console.log(`Test ${passed ? "PASSED" : "FAILED"}`);
    console.log("-------------------");

    return passed;
}

console.log("Starting Fee Calculation Verification");
console.log("Formula: (Target + 30c) / (1 - 0.029)");

// Test 1: $5.00
// (500 + 30) / 0.971 = 530 / 0.971 = 545.829... -> ceil -> 546
// Fee: 546 * 0.029 + 30 = 15.834 + 30 = 45.834 (rounds to 46)
// Net: 546 - 46 = 500. Matches.
testCalculation(500, 546);

// Test 2: $100.00
// (10000 + 30) / 0.971 = 10030 / 0.971 = 10329.55... -> ceil -> 10330
// Fee: 10330 * 0.029 + 30 = 299.57 + 30 = 329.57 (rounds to 330)
// Net: 10330 - 330 = 10000. Matches.
testCalculation(10000, 10330);

// Test 3: $1.00 (Minimum)
// (100 + 30) / 0.971 = 130 / 0.971 = 133.88 -> ceil -> 134
// Fee: 134 * 0.029 + 30 = 3.886 + 30 = 33.886 (rounds to 34)
// Net: 134 - 34 = 100. Matches.
testCalculation(100, 134);
