const checkoutHandler = require("../handlers/checkoutHandler");
const { verifyAuth } = require("../plugins/authVerify");

async function checkoutRoutes(fastify, options) {
    fastify.post("/", {
        preHandler: verifyAuth(["buyer"])
    }, checkoutHandler.createCheckoutSession);

    fastify.post("/confirm", {
        preHandler: verifyAuth(["buyer"])
    }, checkoutHandler.confirmPayment);
}

module.exports = checkoutRoutes;
