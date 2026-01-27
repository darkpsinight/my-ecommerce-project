const mongoose = require('mongoose');

const disputeMessageSchema = new mongoose.Schema({
    disputeId: {
        type: String,
        required: true,
        index: true
    },
    senderRole: {
        type: String,
        enum: ['BUYER', 'SELLER', 'ADMIN'],
        required: true
    },
    senderId: {
        type: String,
        required: true
    },
    messageBody: {
        type: String,
        required: true,
        maxlength: 2000,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: false // We use custom createdAt and don't need updatedAt for append-only
});

// Compound index for efficient retrieval of messages for a dispute sorted by time
disputeMessageSchema.index({ disputeId: 1, createdAt: 1 });

const DisputeMessage = mongoose.model('DisputeMessage', disputeMessageSchema);

module.exports = { DisputeMessage };
