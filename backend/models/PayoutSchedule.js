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
    includedOrderIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    }],

    // Aggregates for convenience
    totalCount: {
        type: Number,
        default: 0
    },

    totalAmount: {
        type: Number, // Integer cents
        default: 0
    }
}, {
    timestamps: true
});

// Compound Unique Index for Window Idempotency
// One schedule per seller per currency per day
payoutScheduleSchema.index({ sellerId: 1, currency: 1, windowDate: 1 }, { unique: true });

const PayoutSchedule = mongoose.model("PayoutSchedule", payoutScheduleSchema);

module.exports = { PayoutSchedule };
