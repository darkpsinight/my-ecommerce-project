const CheckoutService = require("../services/checkoutService");

const createCheckoutSession = async (request, reply) => {
    try {
        const userId = request.user.uid;
        const result = await CheckoutService.createCheckoutSession(userId);

        return reply.code(200).send({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Checkout Error:", error);
        return reply.code(400).send({
            success: false,
            message: error.message
        });
    }
};

const confirmPayment = async (request, reply) => {
    try {
        const { paymentIntentId } = request.body;
        if (!paymentIntentId) {
            return reply.code(400).send({ success: false, message: "PaymentIntentId is required" });
        }

        const result = await CheckoutService.confirmPayment(paymentIntentId);
        return reply.code(200).send(result);
    } catch (error) {
        console.error("Confirmation Error:", error);
        return reply.code(400).send({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createCheckoutSession,
    confirmPayment
};
