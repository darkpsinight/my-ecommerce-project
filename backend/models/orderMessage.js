const mongoose = require("mongoose");

const orderMessageSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        index: true
    },
    senderUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    senderUserUid: {
        type: String, // Denormalized uid
        required: true
    },
    senderRole: {
        type: String,
        enum: ["buyer", "seller"],
        required: true
    },
    messageText: {
        type: String,
        required: true,
        maxlength: 2000,
        trim: true,
        validate: {
            validator: function (v) {
                // Basic check to ensure it's not empty after trim
                return v && v.trim().length > 0;
            },
            message: "Message text cannot be empty"
        }
    },
    isSystem: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true // Adds createdAt, updatedAt
});

// Index for efficient retrieval by order and time
orderMessageSchema.index({ orderId: 1, createdAt: 1 });

const OrderMessage = mongoose.model("OrderMessage", orderMessageSchema);

module.exports = { OrderMessage };
