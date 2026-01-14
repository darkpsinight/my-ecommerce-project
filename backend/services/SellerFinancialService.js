const mongoose = require('mongoose');
const { LedgerEntry } = require('../models/ledgerEntry');
const { Order } = require('../models/order');
const { Payout } = require('../models/payout');
const { User } = require('../models/user');

class SellerFinancialService {
    /**
     * Get seller balances and lifetime totals by currency
     * @param {string} sellerUid 
     * @returns {Promise<Object>} Balances object
     */
    static async getBalances(sellerUid) {
        // We aggregate everything from the ledger for truth
        const aggregation = await LedgerEntry.aggregate([
            { $match: { user_uid: sellerUid } },
            {
                $group: {
                    _id: "$currency",
                    // Available: Status is available
                    available_amount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "available"] }, "$amount", 0]
                        }
                    },
                    // Pending: Status is locked
                    pending_amount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "locked"] }, "$amount", 0]
                        }
                    },
                    // Lifetime Gross: type = escrow_lock (The moment money enters seller's purview)
                    lifetime_gross_earned: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "escrow_lock"] }, "$amount", 0]
                        }
                    },
                    // Lifetime Refunded: type IN [escrow_reversal, seller_reversal] (Debits)
                    // These amounts are negative in ledger, we want the absolute magnitude
                    lifetime_refunded_net: {
                        $sum: {
                            $cond: [{ $in: ["$type", ["escrow_reversal", "seller_reversal"]] }, "$amount", 0]
                        }
                    },
                    // Paid Out Net Flow: type IN [payout, payout_reservation, payout_fail_reversal]
                    // Payouts are negative, reversals are positive. Sum should be negative.
                    payout_flow_net: {
                        $sum: {
                            $cond: [
                                { $in: ["$type", ["payout", "payout_reservation", "payout_fail_reversal"]] },
                                "$amount",
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Format results
        const balances = aggregation.map(curr => {
            const lifetimeRefunded = Math.abs(curr.lifetime_refunded_net);
            const totalPaidOut = Math.abs(curr.payout_flow_net);

            return {
                currency: curr._id,
                available_amount: curr.available_amount,
                pending_amount: curr.pending_amount,
                total_paid_out: totalPaidOut,
                lifetime_gross_earned: curr.lifetime_gross_earned,
                lifetime_refunded: lifetimeRefunded,
                lifetime_net_earned: curr.lifetime_gross_earned - lifetimeRefunded
            };
        });

        // Default to USD 0 if no history
        if (balances.length === 0) {
            return {
                balances: [{
                    currency: "USD",
                    available_amount: 0,
                    pending_amount: 0,
                    total_paid_out: 0,
                    lifetime_gross_earned: 0,
                    lifetime_refunded: 0,
                    lifetime_net_earned: 0
                }]
            };
        }

        return { balances };
    }

    /**
     * Get orders with financial status
     * @param {string} sellerUid 
     * @param {Object} options { page, limit, currency, escrowStatus, eligibilityStatus }
     */
    static async getOrderFinancials(sellerUid, options = {}) {
        const {
            page = 1,
            limit = 20,
            currency,
            escrowStatus,
            eligibilityStatus
        } = options;

        const query = { sellerId: sellerUid };

        // Status filters
        // We only care about orders that have some financial impact (ignore cancelled/pending maybe? 
        // Design says "List orders". Pending orders usually don't have funds yet until paid.)
        // Let's include everything but maybe filter by user req.

        if (currency) query.currency = currency;
        if (escrowStatus) query.escrowStatus = escrowStatus;
        if (eligibilityStatus) query.eligibilityStatus = eligibilityStatus;

        // Pagination
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .select('externalId createdAt totalAmount currency escrowStatus eligibilityStatus releaseExpectedAt status'), // Select necessary fields
            Order.countDocuments(query)
        ]);

        // Lookup payouts for these orders (if any)
        // We need to know if an order is paid out. 
        // Payout model has `orderId` (ObjectId). 
        const orderIds = orders.map(o => o._id);
        const payoutMap = {};
        if (orderIds.length > 0) {
            const payouts = await Payout.find({ orderId: { $in: orderIds } }).select('orderId payoutId status');
            payouts.forEach(p => {
                payoutMap[p.orderId.toString()] = p;
            });
        }

        const data = orders.map(order => {
            const payout = payoutMap[order._id.toString()] || null;

            // Determine Hold Reason
            let holdReasonCode = "NONE";
            let holdReasonText = null;

            if (order.escrowStatus === "held") {
                if (order.eligibilityStatus === "PENDING_MATURITY") {
                    // Check if NEW_SELLER_HOLD applies? 
                    // For now, simple mapping as requested.
                    holdReasonCode = "STANDARD_MATURITY";
                    holdReasonText = "Standard security hold period pending maturity.";
                } else if (order.eligibilityStatus === "MATURE_HELD") {
                    holdReasonCode = "RISK_REVIEW";
                    holdReasonText = "Funds are held for risk review. Please contact support.";
                }
            } else if (order.escrowStatus === "refunded") {
                holdReasonCode = "NONE"; // Or REFUNDED? Design didn't specify code for refunded, logic says NONE if not held.
            } else if (order.escrowStatus === "released") {
                // Even if released from escrow (available), it might not be paid out yet. 
                // But it's not "HELD".
                holdReasonCode = "NONE";
            }

            // If dispute? Order model doesn't have dispute flag yet directly on root, 
            // but if we had it, we would set DISPUTE_OPEN. 
            // Assuming for now standard flows.

            return {
                orderId: order.externalId, // Public ID
                orderDate: order.createdAt,
                totalAmount: order.totalAmount,
                currency: order.currency,
                escrowStatus: order.escrowStatus,
                eligibilityStatus: order.eligibilityStatus,
                holdReleaseDate: order.releaseExpectedAt,
                holdReasonCode,
                holdReasonText,
                payoutId: payout ? payout.payoutId : null,
                payoutStatus: payout ? payout.status : null
            };
        });

        return {
            data,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get payout history
     * @param {string} sellerUid 
     * @param {Object} options 
     */
    static async getPayouts(sellerUid, options = {}) {
        const { page = 1, limit = 20 } = options;
        const skip = (page - 1) * limit;
        const query = { sellerId: sellerUid };

        const [payouts, total] = await Promise.all([
            Payout.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('orderId', 'externalId'), // Populate to get public order IDs
            Payout.countDocuments(query)
        ]);

        const data = payouts.map(p => ({
            payoutId: p.payoutId,
            amount: p.amount,
            currency: p.currency,
            status: p.status,
            initiatedAt: p.createdAt,
            processedAt: p.processedAt,
            // Design asks for array of orderIds. Payout model is currently 1:1 but design prepared for 1:N.
            // We return array.
            orderIds: p.orderId ? [p.orderId.externalId] : [],
            failureCode: p.failureCode || (p.status === 'FAILED' ? 'UNKNOWN_ERROR' : null),
            failureMessage: p.failureReason
        }));

        return {
            data,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / limit)
            }
        };
    }
}

module.exports = SellerFinancialService;
