const mongoose = require("mongoose");
const { Schema } = mongoose;

const auditLogSchema = new Schema({
    // Action being performed (e.g., "ADMIN_REFUND_ESCROW", "ADMIN_FORCE_RELEASE")
    action: {
        type: String,
        required: true,
        index: true
    },
    // ID of the admin performing the action
    actorId: {
        type: String,
        required: true,
        index: true
    },
    // The target entity ID (e.g., Order ID, User ID)
    targetId: {
        type: String,
        required: true,
        index: true
    },
    // The type of the target entity (e.g., "Order", "User")
    targetType: {
        type: String,
        required: true
    },
    // Outcome of the action
    status: {
        type: String,
        enum: ["SUCCESS", "FAILURE"],
        required: true,
        index: true
    },
    // Error Code (if failure) - useful for metrics/filtering
    errorCode: {
        type: String
    },
    // Detailed error message
    errorMessage: {
        type: String
    },
    // Additional context (e.g., refund reason, Stripe error details)
    metadata: {
        type: Schema.Types.Mixed
    },
    // When the action occurred
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 60 * 24 * 90 // Optional: Auto-expire logs after 90 days to manage size
    }
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = { AuditLog };
