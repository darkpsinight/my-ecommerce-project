const mongoose = require("mongoose");
const { connectDB } = require("../models/connectDB");
const controller = require("../controllers/financialObservabilityController");
const { runIntegrityChecks } = require("../jobs/ledgerIntegrityMonitor");
const { Payout } = require("../models/payout");
const { Order } = require("../models/order");

// Mock Fastify Reply
const mockReply = {
    send: (data) => {
        console.log("RESPONSE SUCCESS:");
        console.log(JSON.stringify(data, null, 2));
        return data;
    },
    status: (code) => {
        console.log(`RESPONSE STATUS: ${code}`);
        return mockReply;
    }
};

// Mock Request
const mockReq = (params = {}, query = {}, log = console) => ({
    params,
    query,
    log
});

const mockFastifyLogger = {
    log: {
        info: (msg) => console.log(`[INFO] ${msg}`),
        warn: (msg) => console.log(`[WARN] ${msg}`),
        error: (msg) => console.log(`[ERROR] ${msg}`)
    }
};

async function runVerification() {
    try {
        await connectDB(mockFastifyLogger);
        console.log("Connected to DB.");

        console.log("\n=============================================");
        console.log("SCENARIO A: Financial Health Snapshot");
        console.log("=============================================");
        await controller.getFinancialSnapshot(mockReq(), mockReply);

        console.log("\n=============================================");
        console.log("SCENARIO B: Payout Trace");
        console.log("=============================================");
        // Find a payout to trace
        const payout = await Payout.findOne({ status: 'COMPLETED' }) || await Payout.findOne({});
        if (payout) {
            console.log(`Tracing Payout ID: ${payout.payoutId}`);
            await controller.getPayoutTrace(mockReq({ id: payout.payoutId }), mockReply);
        } else {
            console.log("No payout found to trace. Trying Order...");
            const order = await Order.findOne({});
            if (order) {
                console.log(`Tracing Order ID: ${order.externalId}`);
                await controller.getPayoutTrace(mockReq({ id: order.externalId }), mockReply);
            } else {
                console.log("No Data to trace.");
            }
        }

        console.log("\n=============================================");
        console.log("SCENARIO C: Audit Logs");
        console.log("=============================================");
        await controller.getAuditLogs(mockReq({}, { limit: 5 }), mockReply);

        console.log("\n=============================================");
        console.log("SCENARIO D: Integrity Monitor (Dry Run)");
        console.log("=============================================");
        await runIntegrityChecks(mockFastifyLogger);

        console.log("\nVERIFICATION COMPLETE.");
        process.exit(0);
    } catch (err) {
        console.error("Verification Failed:", err);
        process.exit(1);
    }
}

runVerification();
