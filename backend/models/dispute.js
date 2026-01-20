const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const disputeSchema = new mongoose.Schema({
    disputeId: {
        type: String,
        required: true,
        unique: true,
        default: uuidv4
    },
    // Stripe Dispute ID (for mapping)
    stripeDisputeId: {
        type: String,
        required: true,
        unique: true
    },
    paymentIntentId: {
        type: String,
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    sellerId: {
        type: String, // UID
        required: true,
        index: true
    },
    buyerId: {
        type: String, // UID
        required: true
    },
    amount: {
        type: Number, // Cents
        required: true
    },
    currency: {
        type: String,
        required: true,
        uppercase: true
    },
    status: {
        type: String,
        enum: [
            // Active Locking States
            'OPEN',
            'UNDER_REVIEW',
            'WARNING_NEEDS_RESPONSE',
            'NEEDS_RESPONSE',

            // Terminal States
            'WON',
            'LOST',
            'CLOSED'
        ],
        required: true,
        index: true
    },
    reason: {
        type: String
    },
    evidenceDueBy: {
        type: Date
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

// Index for getting active disputes for a seller
disputeSchema.index({ sellerId: 1, status: 1 });

const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = { Dispute };
