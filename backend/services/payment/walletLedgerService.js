const { LedgerEntry } = require("../../models/ledgerEntry");
const mongoose = require("mongoose");

class WalletLedgerService {
    /**
     * READ-ONLY: Gets the current available balance for a buyer (in CENTS).
     * Aggregates strictly allowed ledger types.
     * 
     * @param {String} buyerUid - The buyer's user UID
     * @param {String} currency - ISO currency code (e.g. 'USD')
     * @returns {Promise<Number>} Balance in CENTS
     */
    async getBuyerBalance(buyerUid, currency) {
        if (!buyerUid) throw new Error("Buyer UID is required");
        if (!currency) throw new Error("Currency is required");

        // Allowed types for Buyer Wallet (Step 23.1 Placeholders)
        const ALLOWED_TYPES = [
            "wallet_credit_placeholder", // (+)
            "wallet_debit_placeholder",   // (-)
            "wallet_credit_deposit",      // (+) Funding
            "wallet_debit_purchase",      // (-) Spending
            "wallet_credit_refund"        // (+) Refund (Strictly scoped for balance)
        ];

        // Signed aggregation
        const result = await LedgerEntry.aggregate([
            {
                $match: {
                    user_uid: buyerUid,
                    role: "buyer", // Strict Role Check
                    currency: currency.toUpperCase(),
                    status: "available", // Only available funds count towards balance
                    type: { $in: ALLOWED_TYPES }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);

        return result.length > 0 ? result[0].totalAmount : 0;
    }

    /**
     * READ-ONLY: Verifies that the buyer's wallet satisfies all invariants.
     * Primary Check: Balance must be >= 0.
     * 
     * @param {String} buyerUid 
     * @param {String} currency 
     * @returns {Promise<Boolean>} True if valid, throws Error if invalid
     */
    async assertWalletInvariants(buyerUid, currency) {
        const balance = await this.getBuyerBalance(buyerUid, currency);

        // Invariant 1: Non-Negative Balance
        if (balance < 0) {
            throw new Error(`[WALLET_INVARIANT_VIOLATION] Buyer ${buyerUid} has negative balance: ${balance} ${currency}`);
        }

        return true;
    }

    /**
     * Gets comprehensive wallet statistics derived largely from the ledger.
     * 
     * @param {String} buyerUid 
     * @param {String} currency 
     * @returns {Promise<{balance: Number, totalFunded: Number, totalSpent: Number, currency: String}>}
     */
    async getWalletStats(buyerUid, currency) {
        if (!buyerUid) throw new Error("Buyer UID is required");
        if (!currency) throw new Error("Currency is required");

        const currencyUpper = currency.toUpperCase();

        // 1. Get Current Available Balance
        const balance = await this.getBuyerBalance(buyerUid, currencyUpper);

        // 2. Aggregate Total Funded (All time credit deposits)
        const FUNDING_TYPES = [
            "wallet_credit_placeholder",
            "wallet_credit_deposit"
        ];

        const fundedResult = await LedgerEntry.aggregate([
            {
                $match: {
                    user_uid: buyerUid,
                    role: "buyer",
                    currency: currencyUpper,
                    type: { $in: FUNDING_TYPES }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" }
                }
            }
        ]);
        const totalFunded = fundedResult.length > 0 ? fundedResult[0].totalAmount : 0;

        // 3. Aggregate Total Spent (All time purchases)
        // Note: Purchases are stored as negative numbers (debits), so we abs() the sum or sum abs(amount)
        const SPENDING_TYPES = [
            "wallet_debit_purchase"
        ];

        const spentResult = await LedgerEntry.aggregate([
            {
                $match: {
                    user_uid: buyerUid,
                    role: "buyer",
                    currency: currencyUpper,
                    type: { $in: SPENDING_TYPES }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" } // This will be negative
                }
            }
        ]);
        const totalSpent = spentResult.length > 0 ? Math.abs(spentResult[0].totalAmount) : 0;

        return {
            balance,      // Cents
            totalFunded,  // Cents
            totalSpent,   // Cents
            currency: currencyUpper
        };
    }

    /**
     * Gets recent wallet transactions from the ledger.
     * 
     * @param {String} buyerUid 
     * @param {Number} limit 
     * @returns {Promise<Array>}
     */
    async getRecentTransactions(buyerUid, limit = 10) {
        if (!buyerUid) throw new Error("Buyer UID is required");

        const transactions = await LedgerEntry.find({
            user_uid: buyerUid,
            role: "buyer",
            type: {
                $in: [
                    "wallet_credit_placeholder",
                    "wallet_debit_purchase",
                    "wallet_credit_deposit",
                    "refund" // Include refunds if applicable
                ]
            }
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return transactions.map(tx => ({
            externalId: tx.externalId,
            type: tx.type,
            amount: tx.amount, // Signed integer
            currency: tx.currency,
            status: tx.status,
            description: tx.description,
            createdAt: tx.createdAt,
            relatedOrderId: tx.related_order_id,
            metadata: tx.metadata
        }));
    }
    /**
     * Executes a wallet purchase by creating a debit ledger entry.
     * Enforces non-negative balance invariant.
     * 
     * @param {String} buyerUid 
     * @param {Number} amountCents (Positive Integer)
     * @param {String} currency 
     * @param {String} description 
     * @param {Object} metadata 
     * @returns {Promise<Object>} The created ledger entry
     */
    async chargeBuyer(buyerUid, amountCents, currency, description, metadata = {}) {
        if (!buyerUid) throw new Error("Buyer UID is required");
        if (!amountCents || amountCents <= 0) throw new Error("Positive amount is required");

        const currencyUpper = currency.toUpperCase();

        // 1. Check Balance (Optimistic, not locking)
        const currentBalance = await this.getBuyerBalance(buyerUid, currencyUpper);
        if (currentBalance < amountCents) {
            throw new Error(`Insufficient funds. Available: ${currentBalance}, Required: ${amountCents}`);
        }

        // 2. Create Debit Entry
        const entry = await LedgerEntry.create({
            user_uid: buyerUid,
            role: "buyer",
            type: "wallet_debit_purchase",
            amount: -Math.abs(amountCents), // Debit is negative
            currency: currencyUpper,
            status: "available",
            description: description || "Purchase",
            metadata: {
                ...metadata,
                timestamp: new Date()
            }
        });

        // 3. Verify Invariant (Post-Auth Check)
        // If race condition caused negative balance, this could catch it (eventually consistent)
        // In a strict financial system, we might want atomic transactions or optimistic concurrency control on a balance document.
        // For now, this mimics the "assertWalletInvariants" strategy.
        await this.assertWalletInvariants(buyerUid, currencyUpper);

        return entry;
    }

    /**
     * Locks funds for the seller in escrow.
     * Used for Wallet Checkout.
     * 
     * @param {String} sellerUid 
     * @param {Number} amountCents 
     * @param {String} currency 
     * @param {Object} order - The Order document
     * @returns {Promise<Object>} The created ledger entry
     */
    async lockFundsForSeller(sellerUid, amountCents, currency, order) {
        if (!sellerUid) throw new Error("Seller UID is required");

        const currencyUpper = currency.toUpperCase();

        // Create Escrow Lock Entry
        // Mirrors LedgerService.recordPaymentSuccess behavior for Seller
        const entry = await LedgerEntry.create({
            user_uid: sellerUid,
            role: "seller",
            type: "escrow_lock",
            amount: Math.abs(amountCents), // Positive quantity locked
            currency: currencyUpper,
            status: "locked",
            description: `Escrow lock for Order ${order.externalId} (Wallet Payment)`,
            related_order_id: order._id,
            metadata: {
                order_external_id: order.externalId,
                source: "wallet_checkout"
            },
        });

        return entry;
    }
}

module.exports = new WalletLedgerService();
