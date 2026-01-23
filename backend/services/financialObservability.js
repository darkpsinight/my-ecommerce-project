const { LedgerEntry } = require("../models/ledgerEntry");
const { Payout } = require("../models/payout");
const { Order } = require("../models/order");
const { AuditLog } = require("../models/auditLog");
const { PayoutSchedule } = require("../models/PayoutSchedule");

/**
 * Service for Read-Only Financial Observability
 * strictly enforcing NO ledger/payout mutations.
 */
class FinancialObservabilityService {

    /**
     * Generates a point-in-time snapshot of financial health.
     * Completely Read-Only.
     */
    static async getFinancialSnapshot() {
        const timestamp = new Date().toISOString();

        // 1. Aggregated Ledger Stats
        const ledgerStats = await LedgerEntry.aggregate([
            {
                $group: {
                    _id: "$status",
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Calculate totals from aggregation
        let totalEscrowLocked = 0;
        let totalSellerAvailable = 0;
        let netCheckSum = 0;

        // Helper to sum up amounts for invariance check
        // We also want to compute the global net sum (Credits + Debits) which MUST be 0
        const globalSum = await LedgerEntry.aggregate([
            {
                $group: {
                    _id: null,
                    netTotal: { $sum: "$amount" }
                }
            }
        ]);

        if (globalSum.length > 0) {
            netCheckSum = globalSum[0].netTotal || 0;
        }

        // Map status-based totals
        ledgerStats.forEach(stat => {
            if (stat._id === 'locked') totalEscrowLocked = stat.totalAmount || 0;
            if (stat._id === 'available') totalSellerAvailable = stat.totalAmount || 0;
        });

        // 2. Payout Health Stats
        const payoutStats = await Payout.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const payoutHealth = {
            total_pending: 0,
            total_processing: 0,
            total_completed: 0,
            total_failed: 0,
            total_reversed: 0,
            total_cancelled: 0
        };

        payoutStats.forEach(stat => {
            if (stat._id) {
                const key = `total_${stat._id.toLowerCase()}`;
                if (payoutHealth.hasOwnProperty(key)) {
                    payoutHealth[key] = stat.count || 0;
                }
            }
        });

        // 3. Integrity Check Status
        const integrityCheck = {
            status: "CHECK_LOGS",
            issues_detected: 0
        };

        return {
            timestamp,
            global_ledger: {
                total_escrow_locked: totalEscrowLocked || 0,
                total_seller_available: totalSellerAvailable || 0,
                total_platform_revenue: 0,
                net_invariance_check: netCheckSum || 0
            },
            payout_health: payoutHealth,
            integrity_check: integrityCheck
        };
    }

    /**
     * Reconstructs the full lifecycle of a payout/order.
     * Read-Only.
     * @param {string} payoutId - Optional Payout UUID
     * @param {string} orderId - Optional Order ObjectId
     */
    static async getPayoutTrace({ payoutId, orderId }) {
        if (!payoutId && !orderId) {
            throw new Error("Either payoutId or orderId is required.");
        }

        let payout = null;
        let order = null;

        // Resolve Order & Payout
        if (payoutId) {
            payout = await Payout.findOne({ payoutId });
            if (payout) {
                order = await Order.findById(payout.orderId);
            }
        } else if (orderId) {
            order = await Order.findById(orderId);
            if (order) {
                payout = await Payout.findOne({ orderId: order._id });
            }
        }

        if (!order && !payout) {
            throw new Error("Trace target not found.");
        }

        const events = [];
        const targetOrderId = order ? order._id : (payout ? payout.orderId : null);

        // 1. Order Creation
        if (order) {
            events.push({
                timestamp: order.createdAt,
                stage: "ORDER_CREATION",
                detail: "Order placed",
                source: "Order",
                id: order._id.toString(),
                meta: { status: order.status }
            });
        }

        // 2. Ledger Events
        if (targetOrderId) {
            const ledgerEntries = await LedgerEntry.find({ related_order_id: targetOrderId }).sort({ createdAt: 1 });
            ledgerEntries.forEach(entry => {
                events.push({
                    timestamp: entry.createdAt,
                    stage: `LEDGER_${entry.type.toUpperCase()}`,
                    detail: `Ledger: ${entry.type} (${entry.amount} ${entry.currency}) -> ${entry.status}`,
                    amount: entry.amount,
                    source: "LedgerEntry",
                    id: entry.externalId
                });
            });
        }

        // 3. Payout Schedule (If exists)
        // Note: PayoutSchedule might be ephemeral or deleted, but if it persists:
        if (targetOrderId) {
            // Assuming we might store orderId in schedule, or we look it up via payout
            // Actually PayoutSchedule is per seller usually, but let's see if we can find one for this item?
            // Current PayoutSchedule model is eligibility based on seller.
            // It doesn't link 1:1 to an order easily unless we store specific items.
            // We'll skip specific PayoutSchedule lookup unless we have an ID from somewhere.
            // If payout has scheduleId:
            if (payout && payout.scheduleId) {
                const schedule = await PayoutSchedule.findOne({ scheduleId: payout.scheduleId });
                if (schedule) {
                    events.push({
                        timestamp: schedule.createdAt,
                        stage: "PAYOUT_ELIGIBILITY",
                        detail: `Included in Schedule ${schedule.scheduleId}`,
                        source: "PayoutSchedule",
                        id: schedule.scheduleId
                    });
                }
            }
        }

        // 4. Payout Execution Events
        if (payout) {
            events.push({
                timestamp: payout.createdAt,
                stage: "PAYOUT_CREATED",
                detail: `Payout object created with status ${payout.status}`,
                source: "Payout",
                id: payout.payoutId
            });

            if (payout.reservedAt) {
                events.push({
                    timestamp: payout.reservedAt,
                    stage: "PAYOUT_RESERVING",
                    detail: "Funds reserved timestamp",
                    source: "Payout"
                });
            }

            if (payout.processingAt) {
                events.push({
                    timestamp: payout.processingAt,
                    stage: "PAYOUT_PROCESSING",
                    detail: "Sent to Stripe",
                    source: "Payout"
                });
            }

            // Add Payout History items
            if (payout.payoutHistory && payout.payoutHistory.length > 0) {
                payout.payoutHistory.forEach(hist => {
                    events.push({
                        timestamp: hist.attemptAt,
                        stage: "PAYOUT_ATTEMPT",
                        detail: `Attempt Status: ${hist.status}${hist.failureReason ? ` Reason: ${hist.failureReason}` : ''}`,
                        source: "PayoutHistory",
                        stripeTransferId: hist.stripeTransferId
                    });
                });
            }

            if (payout.status === 'COMPLETED') {
                events.push({
                    timestamp: payout.updatedAt, // Approximate
                    stage: "PAYOUT_COMPLETED",
                    detail: "Payout Finalized",
                    stripeTransferId: payout.stripeTransferId,
                    source: "Payout"
                });
            }
        }

        // 5. Audit Logs
        // Trace any admin actions on these entities
        const queryIds = [];
        if (order) queryIds.push(order._id.toString());
        if (payout) queryIds.push(payout.payoutId);
        if (order && order.sellerId) queryIds.push(order.sellerId); // careful, might be noisy

        // Just strictly order and payout specific
        const specificIds = [];
        if (order) specificIds.push(order._id.toString());
        if (payout) specificIds.push(payout.payoutId);

        const logs = await AuditLog.find({ targetId: { $in: specificIds } }).sort({ createdAt: 1 });
        logs.forEach(log => {
            events.push({
                timestamp: log.createdAt,
                stage: `ADMIN_ACTION_${log.action}`,
                detail: `${log.action} by ${log.actorId}: ${log.status}`,
                source: "AuditLog",
                id: log._id.toString()
            });
        });


        // Sort chronological
        events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return {
            payoutId: payout ? payout.payoutId : null,
            orderId: order ? order._id : null,
            sellerId: order ? order.sellerId : (payout ? payout.sellerId : null),
            lifecycle_events: events
        };
    }

    /**
     * Retrieves Audit Logs with filtering.
     * Read-Only.
     */
    static async getAuditLogs({ actorId, targetId, action, startDate, endDate, limit = 50, offset = 0 }) {
        const query = {};

        if (actorId) query.actorId = actorId;
        if (targetId) query.targetId = targetId;
        if (action) query.action = action;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit));

        const total = await AuditLog.countDocuments(query);

        return {
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            logs
        };
    }
}

module.exports = FinancialObservabilityService;
