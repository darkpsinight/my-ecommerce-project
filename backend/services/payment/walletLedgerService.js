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
            "wallet_debit_purchase"       // (-) Spending
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
}

module.exports = new WalletLedgerService();
