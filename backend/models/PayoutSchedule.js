const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const payoutScheduleSchema = new mongoose.Schema({
    scheduleId: {
        type: String,
        default: uuidv4,
        unique: true,
        required: true,
        index: true
    },

    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        unique: true, // 1-to-1 Mapping
        index: true
    },

    sellerId: {
        type: String, // UID
        required: true,
        index: true
    },

    currency: {
        type: String,
        required: true,
        uppercase: true
    },

    // Idempotency Window: "YYYY-MM-DD"
    // Kept for record-keeping of WHEN it was scheduled
    windowDate: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}-\d{2}$/
    },

    scheduledAt: {
        type: Date,
        default: Date.now
    },

    status: {
        type: String,
        enum: ["SCHEDULED", "PROCESSING", "SKIPPED", "CANCELLED", "CONSUMED"],
        required: true,
        index: true
    },

    // Full snapshot of Steps 10 Check
    eligibilitySnapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Orders locked for this batch
    // COMPATIBILITY: Will always contain exactly one ID (the same as orderId)
    // Kept to prevent breaking Step 15 Service/Worker which iterates this array.
    includedOrderIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }],

    // Aggregates for convenience
    totalCount: {
        type: Number,
        default: 1 // Always 1 for 1-to-1
    },

    totalAmount: {
        type: Number, // Integer cents
        default: 0
    }
}, {
    timestamps: true
});

// Unique Index on orderId to ensure strict 1-to-1
payoutScheduleSchema.index({ orderId: 1 }, { unique: true });

const PayoutSchedule = mongoose.model("PayoutSchedule", payoutScheduleSchema);

module.exports = { PayoutSchedule };
