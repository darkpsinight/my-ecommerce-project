const mongoose = require("mongoose");
const { configs } = require("../configs");
const { User } = require("../models/user");
const { fundWallet } = require("../handlers/walletHandlers");
const { createCheckoutSession } = require("../handlers/checkoutHandler");

function createMockReply() {
    let sentData = null;
    let statusCode = 200;
    return {
        code: function (c) { statusCode = c; return this; },
        status: function (c) { statusCode = c; return this; },
        send: function (data) { sentData = data; return this; },
        getSentData: () => sentData,
        getStatusCode: () => statusCode
    };
}

async function run() {
    try {
        await mongoose.connect(configs.MONGO_URI);
        console.log("DB Connected");

        const buyer = await User.findOne({ email: 'buyer@test.com' });
        console.log("Buyer:", buyer.uid);

        const req = {
            user: { uid: buyer.uid },
            body: { amount: 1000, currency: 'USD' },
            log: console
        };
        const res = createMockReply();

        await fundWallet(req, res);

        console.log("Status:", res.getStatusCode());
        console.log("Data:", JSON.stringify(res.getSentData(), null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
