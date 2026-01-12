const escrowService = require("../services/payment/escrowService");

const releaseEscrow = async (request, reply) => {
    const { orderId } = request.params;
    const adminId = request.user.uid; // Assuming auth middleware populates this

    try {
        const result = await escrowService.releaseEscrow(orderId, adminId);
        reply.code(200).send(result);
    } catch (error) {
        request.log.error(error);
        if (error.code === "INVALID_ESCROW_STATUS" || error.code === "ORDER_NOT_DELIVERED") {
            reply.code(400).send({ message: error.message, code: error.code });
        } else if (error.code === "ORDER_NOT_FOUND") {
            reply.code(404).send({ message: error.message, code: error.code });
        } else {
            reply.code(500).send({ message: "Internal Server Error", code: "INTERNAL_ERROR" });
        }
    }
};

const refundEscrow = async (request, reply) => {
    const { orderId } = request.params;
    const { reason } = request.body || {}; // Optional body
    const adminId = request.user.uid;

    try {
        const result = await escrowService.refundEscrow(orderId, adminId, reason);
        reply.code(200).send(result);
    } catch (error) {
        request.log.error(error);
        if (error.code === "INVALID_ESCROW_STATUS") {
            reply.code(400).send({ message: error.message, code: error.code });
        } else if (error.code === "ORDER_NOT_FOUND") {
            reply.code(404).send({ message: error.message, code: error.code });
        } else {
            reply.code(500).send({ message: "Internal Server Error", code: "INTERNAL_ERROR" });
        }
    }
};

module.exports = {
    releaseEscrow,
    refundEscrow
};
