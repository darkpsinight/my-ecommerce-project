const { Payout } = require("../models/payout");
const { LedgerEntry } = require("../models/ledgerEntry");

/**
 * List Payouts (Admin Read-Only)
 * Filterable by status, sellerId, currency, date range.
 * Paginated.
 */
const listPayouts = async (request, reply) => {
    const {
        page = 1,
        limit = 20,
        status,
        sellerId,
        currency,
        startDate,
        endDate
    } = request.query;

    const query = {};

    // 1. Apply Filters
    if (status) query.status = status;
    if (sellerId) query.sellerId = sellerId;
    if (currency) query.currency = currency;

    // Date Range Filter (createdAt)
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 2. Pagination Calculation
    const skip = (page - 1) * limit;
    const limitInt = parseInt(limit);

    // 3. Execution (Lean for Read-Only)
    const [payouts, total] = await Promise.all([
        Payout.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitInt)
            .lean() // Plain JS Objects, no mongoose state
            .select("payoutId orderId sellerId amount currency status createdAt failureReason stripeTransferId"), // Specific projection
        Payout.countDocuments(query)
    ]);

    // 4. Transform / Sanitize Response (Double check projection)
    // We already selected fields, but let's ensure strictly no internal fields leak if projection fails
    const sanitizedPayouts = payouts.map(p => ({
        payoutId: p.payoutId,
        orderId: p.orderId,
        sellerId: p.sellerId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        createdAt: p.createdAt,
        failureReason: p.failureReason,     // Only present if exists
        stripeTransferId: p.stripeTransferId // Only present if exists
    }));

    return reply.send({
        payouts: sanitizedPayouts,
        pagination: {
            page: parseInt(page),
            limit: limitInt,
            total,
            pages: Math.ceil(total / limitInt)
        }
    });
};

/**
 * Get Payout Detail (Admin Read-Only)
 * Includes link to Ledger Entries (IDs only).
 */
const getPayoutDetail = async (request, reply) => {
    const { payoutId } = request.params;

    // 1. Fetch Payout
    const payout = await Payout.findOne({ payoutId })
        .lean()
        .select("payoutId orderId sellerId amount currency status createdAt updatedAt failureReason stripeTransferId"); // Strict projection

    if (!payout) {
        return reply.code(404).send({ error: "Payout not found" });
    }

    // 2. Fetch Helper: Ledger Entry IDs
    // Linked via orderId as per design
    const ledgerEntries = await LedgerEntry.find({ related_order_id: payout.orderId })
        .sort({ createdAt: 1 })
        .lean()
        .select("_id"); // ONLY IDs

    const ledgerEntryIds = ledgerEntries.map(entry => entry._id.toString());

    // 3. Construct Response
    const response = {
        payoutId: payout.payoutId,
        orderId: payout.orderId,
        sellerId: payout.sellerId,
        amount: payout.amount,
        currency: payout.currency,
        status: payout.status,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt,
        failureReason: payout.failureReason,
        stripeTransferId: payout.stripeTransferId,
        ledgerEntryIds: ledgerEntryIds // Array of strings
    };

    return reply.send(response);
};

module.exports = {
    listPayouts,
    getPayoutDetail
};
