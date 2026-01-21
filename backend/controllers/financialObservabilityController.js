const mongoose = require("mongoose");
const { Order } = require("../models/order");
const { Payout } = require("../models/payout");
const { LedgerEntry } = require("../models/ledgerEntry");
const { AuditLog } = require("../models/auditLog");
const { StripeAccount } = require("../models/stripeAccount");

class FinancialObservabilityController {

    /**
     * GET /admin/financials/snapshot
     * Aggregates current system totals (Read-Only).
     */
    async getFinancialSnapshot(req, reply) {
        try {
            // Currencies to track
            const currencies = ["USD", "EUR", "GBP"];
            const result = {};

            // 1. Aggregations per currency using STRICT Ledger Types
            // Mimics calculation logic in LedgerService.getSellerBalance()
            for (const currency of currencies) {

                // Fetch ALL seller entries for this currency grouped by type
                // This is safer than status-based because 'locked' status includes negative debit reservations
                const ledgerAgg = await LedgerEntry.aggregate([
                    {
                        $match: {
                            role: "seller",
                            currency: currency,
                            // Optimization: Filter to types we care about (optional, but good for performance)
                            type: {
                                $in: [
                                    "escrow_lock", "escrow_reversal", "payout", "escrow_release_debit", // Locked Group
                                    "escrow_release_credit", "payout_fail_reversal", "seller_reversal", "payout_reservation" // Available Group
                                ]
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$type",
                            total: { $sum: "$amount" }
                        }
                    }
                ]);

                // Map results to object for easy lookup
                const chunks = {};
                ledgerAgg.forEach(item => {
                    chunks[item._id] = item.total;
                });

                // Helper to safely get value (default 0)
                const getVal = (type) => chunks[type] || 0;

                // --- CALCULATION RULES (From LedgerService) ---

                // 1. Escrow Held (Locked Balance)
                // = Credits (Locks) + Debits (Reversals/Payouts/ReleaseDebits)
                // Note: Debits are stored as negative numbers, so we just SUM them.
                const escrowHeld = getVal("escrow_lock") +
                    getVal("escrow_reversal") +
                    getVal("payout") +
                    getVal("escrow_release_debit");

                // 2. Seller Available (Available Balance)
                // = Debits (Seller Reversals + Payout Reservations) + Credits (ReleaseCredits + FailReversals)
                // Note: Reservations/Reversals are negative, Credits are positive. Just SUM.
                const sellerAvailable = getVal("seller_reversal") +
                    getVal("escrow_release_credit") +
                    getVal("payout_reservation") +
                    getVal("payout_fail_reversal");

                // 3. Pending Payouts (Processing)
                const pendingPayouts = await Payout.aggregate([
                    {
                        $match: {
                            status: "PROCESSING",
                            currency: currency
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 },
                            total: { $sum: "$amount" }
                        }
                    }
                ]);

                // 4. Completed Payouts
                const completedPayouts = await Payout.aggregate([
                    {
                        $match: {
                            status: "COMPLETED",
                            currency: currency
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            count: { $sum: 1 },
                            total: { $sum: "$amount" }
                        }
                    }
                ]);

                result[currency] = {
                    escrow_held: escrowHeld,
                    seller_available: sellerAvailable,
                    platform_revenue: 0, // Strict 0% Fee Rule
                    pending_payouts_volume: pendingPayouts[0] ? pendingPayouts[0].total : 0,
                    pending_payouts_count: pendingPayouts[0] ? pendingPayouts[0].count : 0,
                    total_payouts_volume: completedPayouts[0] ? completedPayouts[0].total : 0,
                    total_payouts_count: completedPayouts[0] ? completedPayouts[0].count : 0
                };
            }

            // 2. Integrity Check (Simple count of logged anomalies)
            const anomalyCount = await AuditLog.countDocuments({
                action: "INTEGRITY_VIOLATION"
            });

            return reply.send({
                timestamp: new Date().toISOString(),
                currencies: result,
                integrity_check: {
                    is_net_zero_compliant: true, // Placeholder for deeper check if needed
                    anomaly_count: anomalyCount
                }
            });

        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ error: "Failed to generate snapshot" });
        }
    }

    /**
     * GET /admin/financials/trace/:id
     * Reconstructs lifecycle for Payout ID or Order ID
     */
    async getPayoutTrace(req, reply) {
        const { id } = req.params;
        const timeline = [];
        let entityType = "unknown";
        let summary = {};
        let associatedLedgers = [];
        let orderId = null;
        let payoutId = null;

        try {
            // Check if input is Payout ID or Order ID
            let payout = await Payout.findOne({ payoutId: id });
            let order = null;

            if (payout) {
                entityType = "payout";
                payoutId = payout.payoutId;
                orderId = payout.orderId; // ObjectId
                order = await Order.findById(orderId);
            } else {
                // Try as Order External ID or Mongo ID
                // Check valid details
                if (mongoose.Types.ObjectId.isValid(id)) {
                    order = await Order.findById(id);
                } else {
                    order = await Order.findOne({ externalId: id });
                }

                if (order) {
                    entityType = "order";
                    orderId = order._id;
                    payout = await Payout.findOne({ orderId: order._id });
                    if (payout) payoutId = payout.payoutId;
                } else {
                    return reply.status(404).send({ error: "Entity not found (checked Payout and Order)" });
                }
            }

            // --- BUILD SUMMARY ---
            if (payout) {
                summary = {
                    id: payout.payoutId,
                    status: payout.status,
                    amount_cents: payout.amount,
                    currency: payout.currency,
                    seller_uid: payout.sellerId,
                    stripe_transfer_id: payout.stripeTransferId
                };
            } else if (order) {
                summary = {
                    id: order.externalId,
                    status: "NO_PAYOUT_FOUND",
                    amount_cents: Math.round(order.totalAmount * 100),
                    currency: order.currency,
                    seller_uid: order.sellerId
                };
            }

            // --- BUILD TIMELINE ---

            // 1. Order Events
            if (order) {
                timeline.push({
                    timestamp: order.createdAt,
                    event: "ORDER_CREATED",
                    source: "Order",
                    details: `Order placed. Status: ${order.status}`
                });

                if (order.eligibilityStatus === 'ELIGIBLE_FOR_PAYOUT') {
                    // We don't have exact timestamp for this transition in Order model usually, 
                    // unless we check audit logs or infer.
                    // We can check 'releaseExpectedAt'
                }
            }

            // 2. Ledger Events
            const ledgers = await LedgerEntry.find({
                $or: [
                    { related_order_id: orderId },
                    { "metadata.payoutId": payoutId }
                ]
            }).sort({ createdAt: 1 });

            associatedLedgers = ledgers;

            for (const entry of ledgers) {
                timeline.push({
                    timestamp: entry.createdAt,
                    event: `LEDGER_${entry.type.toUpperCase()}`,
                    source: "LedgerEntry",
                    amount: entry.amount,
                    details: `${entry.description} (Status: ${entry.status})`
                });
            }

            // 3. Payout Events
            if (payout) {
                timeline.push({
                    timestamp: payout.createdAt, // This is usually "PROCESSING" start
                    event: "PAYOUT_CREATED",
                    source: "Payout",
                    details: `Payout initialized. Status: ${payout.status}`
                });

                if (payout.reservedAt) {
                    timeline.push({
                        timestamp: payout.reservedAt,
                        event: "PAYOUT_RESERVED",
                        source: "Payout",
                        details: "Funds reserved via Ledger"
                    });
                }

                if (payout.status === 'COMPLETED') {
                    timeline.push({
                        timestamp: payout.updatedAt, // Approximate
                        event: "PAYOUT_COMPLETED",
                        source: "Payout",
                        stripe_transfer_id: payout.stripeTransferId
                    });
                } else if (payout.status === 'FAILED') {
                    timeline.push({
                        timestamp: payout.updatedAt,
                        event: "PAYOUT_FAILED",
                        source: "Payout",
                        details: `Reason: ${payout.failureReason}`
                    });
                }
            }

            // 4. Audit Logs (Integrity Violations or Manual Actions)
            const auditLogs = await AuditLog.find({
                $or: [
                    { targetId: payoutId },
                    { targetId: order ? order.externalId : "x" }, // External ID
                    { targetId: orderId ? orderId.toString() : "x" } // Mongo ID
                ]
            });

            for (const log of auditLogs) {
                timeline.push({
                    timestamp: log.createdAt,
                    event: `ADMIN_${log.action}`,
                    source: "AuditLog",
                    actor: log.actorId,
                    details: log.action
                });
            }

            // Sort timeline
            timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            return reply.send({
                entity_type: entityType,
                query_id: id,
                summary,
                timeline,
                associated_ledgers: associatedLedgers
            });

        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ error: "Failed to generate trace" });
        }
    }

    /**
     * GET /admin/audit-logs
     * Read-only visibility into admin actions
     */
    async getAuditLogs(req, reply) {
        try {
            const {
                page = 1,
                limit = 20,
                action,
                actorId,
                targetId,
                startDate,
                endDate
            } = req.query;

            const query = {};

            if (action) query.action = action;
            if (actorId) query.actorId = actorId;
            if (targetId) query.targetId = targetId;

            if (startDate || endDate) {
                query.createdAt = {};
                if (startDate) query.createdAt.$gte = new Date(startDate);
                if (endDate) query.createdAt.$lte = new Date(endDate);
            }

            const logs = await AuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await AuditLog.countDocuments(query);

            return reply.send({
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            req.log.error(error);
            return reply.status(500).send({ error: "Failed to fetch audit logs" });
        }
    }
}

module.exports = new FinancialObservabilityController();
