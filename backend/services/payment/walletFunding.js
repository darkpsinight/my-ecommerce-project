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

        // 2. Confirm PaymentIntent Server-Side (Primitive)
        // This simulates the client-side confirmation in a real flow, but done here for Step 23.2 backend-only scope.
        const confirmedIntent = await stripeAdapter.confirmPaymentIntentServerSide(paymentIntentId);

        if (confirmedIntent.status !== 'succeeded') {
            throw new Error(`PaymentIntent verification failed. Status: ${confirmedIntent.status}`);
        }

        console.log("✅ WalletFundingService: PaymentIntent Confirmed", { status: confirmedIntent.status });

        // 3. Delegate to Idempotent Processor
        return await this.processFundingSuccess(confirmedIntent);
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

        await LedgerEntry.create({
            user_uid: buyerId,
            role: "buyer",
            type: "wallet_credit_placeholder",
            // Use originalAmount from metadata if available (to exclude grossed-up fees)
            // Fallback to paymentIntent.amount if not found (unexpected but safe default)
            amount: paymentIntent.metadata.originalAmount
                ? parseInt(paymentIntent.metadata.originalAmount, 10)
                : paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),
            status: "available",
            related_payment_intent_id: paymentIntentId,
            description: "Wallet funding via Stripe",
            metadata: {
                source: "wallet_funding_service",
                step: "23.2"
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
