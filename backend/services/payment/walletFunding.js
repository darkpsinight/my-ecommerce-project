const walletLedgerService = require("./walletLedgerService");
const { LedgerEntry } = require("../../models/ledgerEntry");
const StripeAdapter = require("./stripeAdapter");
const stripeAdapter = new StripeAdapter();

class WalletFundingService {

    /**
     * Step 23.2: Orchestrate buyer wallet funding flow.
     * 1. Create PaymentIntent
     * 2. Confirm PaymentIntent (Server-side)
     * 3. Process Ledger Entry (Idempotently)
     * 
     * @param {string} buyerUid 
     * @param {number} amountCents 
     * @param {string} currency 
     * @returns {Promise<{success: boolean, balance: number, paymentIntentId: string}>}
     */
    async fundWallet(buyerUid, amountCents, currency = "USD") {
        if (!buyerUid) throw new Error("Buyer UID is required");
        if (!amountCents || amountCents <= 0) throw new Error("Positive amount is required");

        console.log(`💰 WalletFundingService: Initiating funding for ${buyerUid}`, { amountCents, currency });

        // 1. Create PaymentIntent via StripeAdapter Primitive
        // metadata only for traceability, not routing
        const intentResult = await stripeAdapter.createPaymentIntentOnPlatform(
            amountCents,
            currency,
            { buyerId: buyerUid, type: "wallet_topup" }
        );
        const paymentIntentId = intentResult.paymentIntentId;

        console.log("💳 WalletFundingService: Created PaymentIntent", { paymentIntentId });

        // 2. Return Client Secret for Frontend Confirmation
        return {
            success: true,
            clientSecret: intentResult.clientSecret,
            paymentIntentId: paymentIntentId,
            requiresConfirmation: true
        };
    }

    /**
     * Step 23.5: Process Confirmed Funding
     * Called after client-side confirmation or webhook.
     * 
     * @param {string} paymentIntentId 
     * @returns {Promise<Object>}
     */
    async processConfirmedFunding(paymentIntentId) {
        if (!paymentIntentId) throw new Error("PaymentIntent ID is required");

        console.log(`🔄 WalletFundingService: Verifying funding for ${paymentIntentId}`);

        // 1. Retrieve and Verify from Stripe
        // We reuse the adapter to get the instance, but fetch directly to ensure we have the full object with metadata
        const stripe = stripeAdapter.getStripe();
        const fullPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (fullPaymentIntent.status !== 'succeeded') {
            throw new Error(`PaymentIntent verification failed. Status: ${fullPaymentIntent.status}`);
        }

        console.log("✅ WalletFundingService: PaymentIntent Verified Succeeded");

        // 2. Delegate to Idempotent Processor
        return await this.processFundingSuccess(fullPaymentIntent);
    }

    /**
     * Step 23.2: Idempotency Boundary.
     * Processes a successful PaymentIntent to create a ledger entry.
     * Safe to call multiple times with the same PaymentIntent.
     * 
     * @param {object} paymentIntent - Succeeded Stripe PaymentIntent object
     * @returns {Promise<{success: boolean, balance: number, paymentIntentId: string, alreadyProcessed?: boolean}>}
     */
    async processFundingSuccess(paymentIntent) {
        const paymentIntentId = paymentIntent.id;
        const buyerId = paymentIntent.metadata.buyerId;

        if (!buyerId) {
            throw new Error(`PaymentIntent ${paymentIntentId} missing buyerId in metadata`);
        }

        console.log(`🔄 WalletFundingService: Processing Success for ${paymentIntentId}`);

        // A. Idempotency Check
        const existingEntry = await LedgerEntry.exists({
            related_payment_intent_id: paymentIntentId,
            type: "wallet_credit_placeholder"
        });

        if (existingEntry) {
            console.log(`ℹ️ WalletFundingService: Skipping duplicate ledger entry for ${paymentIntentId}`);
            const currentBalance = await walletLedgerService.getBuyerBalance(buyerId, paymentIntent.currency);
            return {
                success: true,
                balance: currentBalance,
                paymentIntentId,
                alreadyProcessed: true
            };
        }

        // B. Create Ledger Entry
        console.log(`📝 WalletFundingService: Creating Ledger Entry for ${buyerId}`);

        // Handle string vs number for amount/originalAmount
        const originalAmount = paymentIntent.metadata.originalAmount;
        const amountToCredit = originalAmount ? parseInt(originalAmount, 10) : paymentIntent.amount;

        await LedgerEntry.create({
            user_uid: buyerId,
            role: "buyer",
            type: "wallet_credit_placeholder",
            amount: amountToCredit,
            currency: paymentIntent.currency.toUpperCase(),
            status: "available",
            related_payment_intent_id: paymentIntentId,
            description: "Wallet funding via Stripe",
            metadata: {
                source: "wallet_funding_service",
                step: "23.5"
            }
        });

        // C. Post-Condition Invariant Check
        await walletLedgerService.assertWalletInvariants(buyerId, paymentIntent.currency);

        const newBalance = await walletLedgerService.getBuyerBalance(buyerId, paymentIntent.currency);

        console.log(`✅ WalletFundingService: Funding Complete. New Balance: ${newBalance}`);

        return {
            success: true,
            balance: newBalance,
            paymentIntentId
        };
    }
}

module.exports = new WalletFundingService();
