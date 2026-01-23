const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { connectDB } = require('../models/connectDB');
const FinancialObservabilityService = require('../services/financialObservability.service');

// Mock Fastify
const fastifyMock = {
    log: {
        info: console.log,
        error: console.error,
        debug: console.debug
    }
};

async function debug() {
    console.log("=== SNAPSHOT DEBUG ===");
    await connectDB(fastifyMock);

    try {
        const snapshot = await FinancialObservabilityService.getFinancialSnapshot();
        console.log("Service Return Value:");
        console.log(JSON.stringify(snapshot, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}

debug();
