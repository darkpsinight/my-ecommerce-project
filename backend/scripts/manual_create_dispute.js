const mongoose = require("mongoose");
const { configs } = require("../configs");
const disputeService = require("../services/dispute/dispute");

(async () => {
    await mongoose.connect(configs.MONGO_URI);

    const orderId = "REPLACE_WITH_ORDER_OBJECT_ID";

    try {
        const dispute = await disputeService.createDispute({
            orderId,
            reason: "manual_test_step_25_6",
            metadata: { source: "manual-test" }
        });

        console.log("Dispute created:", {
            disputeId: dispute._id,
            orderId: dispute.orderId,
            status: dispute.status
        });
    } catch (err) {
        console.error("Failed to create dispute:", err);
    } finally {
        await mongoose.disconnect();
    }
})();
