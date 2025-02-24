const mongoose = require('mongoose');

const blacklistedTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userEmail: {
        type: String,
        required: true,
        index: true
    },
    blacklistedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
});

// Index to automatically remove expired tokens
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for token and expiration
blacklistedTokenSchema.index({ token: 1, expiresAt: 1 });

// Add some helper methods
blacklistedTokenSchema.methods.isExpired = function() {
    return Date.now() >= this.expiresAt;
};

// Static method to check if a token is blacklisted
blacklistedTokenSchema.statics.isTokenBlacklisted = async function(token) {
    const blacklistedToken = await this.findOne({ 
        token,
        expiresAt: { $gt: new Date() }
    });
    return !!blacklistedToken;
};

const BlacklistedToken = mongoose.model('BlacklistedToken', blacklistedTokenSchema);

module.exports = {
    BlacklistedToken
}; 