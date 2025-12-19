const { User } = require("../models/user");
const StripeAdapter = require("../services/payment/stripeAdapter");
const PaymentProcessor = require("../services/payment/paymentProcessor");
const { StripeAccount } = require("../models/stripeAccount");
const { configs } = require("../configs");

const stripeAdapter = new StripeAdapter();

const connectStripeAccount = async (request, reply) => {
    try {
        const uid = request.user.uid;
        const user = await User.findOne({ uid });

        if (!user) {
            return reply.code(404).send({
                success: false,
                error: "User not found"
            });
        }

        const sellerId = user._id;
        const { country = "US", businessType = "individual" } = request.body || {};

        // 1. Ensure Stripe Account exists for this seller
        let account = await StripeAccount.getBySellerId(sellerId);
        let stripeAccountId;

        if (!account) {
            // Create new Custom Account
            const result = await stripeAdapter.createStripeAccountForSeller(sellerId, country, businessType);
            stripeAccountId = result.stripeAccountId;
        } else {
            stripeAccountId = account.stripeAccountId;
        }

        // 2. Create Account Link for onboarding
        const returnUrl = `${configs.SELLER_DASHBOARD_URL}/management/payment-setup?status=return`;
        const refreshUrl = `${configs.SELLER_DASHBOARD_URL}/management/payment-setup?status=refresh`;

        const link = await stripeAdapter.createAccountLink(
            stripeAccountId,
            refreshUrl,
            returnUrl
        );

        return reply.code(200).send({
            success: true,
            data: {
                url: link.url,
                expiresAt: link.expiresAt
            }
        });

    } catch (error) {
        request.log.error(`Error in connectStripeAccount: ${error.message}`);
        return reply.code(error.statusCode || 500).send({
            success: false,
            error: error.message || "Failed to initiate Stripe Connect"
        });
    }
};

const getStripeAccountStatus = async (request, reply) => {
    try {
        const uid = request.user.uid;
        const user = await User.findOne({ uid });

        if (!user) {
            return reply.code(404).send({
                success: false,
                error: "User not found"
            });
        }

        const sellerId = user._id;

        // Get account from DB first
        const account = await StripeAccount.getBySellerId(sellerId);

        if (!account) {
            return reply.code(200).send({
                success: true,
                data: {
                    hasAccount: false,
                    status: null
                }
            });
        }

        // Fetch fresh status from Stripe and update DB
        const status = await stripeAdapter.getAccountStatus(account.stripeAccountId);

        return reply.code(200).send({
            success: true,
            data: {
                hasAccount: true,
                stripeAccountId: account.stripeAccountId,
                ...status
            }
        });

    } catch (error) {
        request.log.error(`Error in getStripeAccountStatus: ${error.message}`);
        return reply.code(error.statusCode || 500).send({
            success: false,
            error: error.message || "Failed to get account status"
        });
    }
};

module.exports = {
    connectStripeAccount,
    getStripeAccountStatus
};
