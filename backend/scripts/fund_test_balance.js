const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { configs } = require('../configs');
const stripe = require('stripe')(configs.STRIPE_SECRET_KEY, {
    apiVersion: configs.STRIPE_API_VERSION
});

async function fundPlatformBalance() {
    try {
        console.log('💰 Starting to fund platform balance...');
        console.log('🔑 Using Stripe Secret Key ending in:', configs.STRIPE_SECRET_KEY.slice(-4));

        // Create a PaymentIntent directly on the platform account
        // Amount: $2000.00
        const amountCents = 200000;

        console.log(`💳 Creating PaymentIntent for $${amountCents / 100}...`);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountCents,
            currency: 'usd',
            description: 'Test Mode Platform Balance Funding',
            payment_method: 'pm_card_visa', // Standard US test card
            confirm: true, // Confirm immediately
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'never' // Ensure we don't need 3DS
            },
            metadata: {
                reason: 'test_balance_funding',
                createdBy: 'script'
            }
        });

        console.log('✅ PaymentIntent created and confirmed!');
        console.log('ID:', paymentIntent.id);
        console.log('Status:', paymentIntent.status);
        console.log('Amount:', paymentIntent.amount);

        // Verify balance (might not be immediate in all test scenarios, but usually is for card payments)
        const balance = await stripe.balance.retrieve();
        console.log('\n🏦 Current Stripe Balance (Pending + Available):');
        console.log('Available:', balance.available.find(b => b.currency === 'usd'));
        console.log('Pending:', balance.pending.find(b => b.currency === 'usd'));

        if (paymentIntent.status === 'succeeded') {
            console.log('\n🎉 SUCCESS: Platform balance should now be funded.');
            console.log('Note: In test mode, funds might land in "pending" initially but usually act as available for transfers relatively quickly or immediately depending on account settings.');
        } else {
            console.warn('\n⚠️ PaymentIntent not succeeded immediately.');
        }

    } catch (error) {
        console.error('❌ Error funding validation:', error);
        process.exit(1);
    }
}

// Execute
fundPlatformBalance();
