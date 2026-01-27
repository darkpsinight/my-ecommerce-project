const mongoose = require("mongoose");
const { configs } = require("../configs");
const { User } = require("../models/user");
const { RefreshToken } = require("../models/refreshToken");
const { authenticationHandlers } = require("../handlers/authenticationHandler");
// Note: We can't easily import handlers directly if they depend on request/reply objects from Fastify.
// Instead, we will simulate the logic or use a mocked request/reply if possible, 
// OR we can just test the database state after performing actions if we were running against the server.
// Since we are running a script, we should probably just use axios to hit the running server?
// PROMPT said "No forced re-login... Manual test flows".
// But we can test the logic via Unit Test style or Integration Test style.
// Let's use AXIOS to hit the local server if it's running? 
// The environment information says "No browser pages are currently open", doesn't say server is running.
// But usually in these tasks, I can assume I can run the server or script interacting with DB.
// Let's write a script that connects to DB and manually calls the logic *if* I can mock request/reply, 
// or better: just write a script that uses Fetch/Axios to hit localhost:5000 (if I start it).
// Given I cannot easily start the server and keep it running while running the script in the same turn without backgrounding,
// And I see `run_command` has background capability.
// But simpler: I will assume the user or I can start the server.
// Actually, `verify_*.js` scripts in this project usually run `node script.js` and connect to DB directly.
// But `getJWTFromRefresh` is a handler.
// Let's look at `verify_step_23_3.js` (from history) - it was an API test? No, it often imports services.
// `authenticationHandler` imports `request`, `reply`.
// Testing handlers directly requires mocking.
//
// Plan B: I will write a script that connects to Mongoose and tests the *Model* methods if possible, 
// but the rotation logic is in the Handler.
//
// Okay, let's write a script that mocks Request/Reply and calls the handler function directly.
// This is the most robust way to verify the Logic without relying on network.

const path = require('path');
// Fix: Use correct relative path to .env from backend/scripts folder
// Trying "../.env" because verify_step_24.js is in backend/scripts and .env is in backend/
const envPath = path.join(__dirname, "../.env");
console.log("Loading .env from:", envPath);
require("dotenv").config({ path: envPath });

const mockRequest = (body, ip = "127.0.0.1") => ({
    body,
    ipAddress: ip,
    log: {
        info: console.log,
        error: console.error,
        warn: console.warn
    },
    generateCsrf: () => "mock-csrf"
});

const mockReply = () => {
    const res = {
        statusCode: 200,
        data: null,
        cookies: {},
        code: (c) => { res.statusCode = c; return res; },
        status: (c) => { res.statusCode = c; return res; },
        send: (d) => { res.data = d; return res; },
        setCookie: (k, v, o) => { res.cookies[k] = v; },
        clearCookie: (k) => { delete res.cookies[k]; },
        generateCsrf: () => "mock-csrf"
    };
    return res;
};

// We need to import the handler. 
// backend/handlers/authenticationHandler.js validates exports.
const { getJWTFromRefresh } = require("../handlers/authenticationHandler");
const { getRefreshToken } = require("../models/refreshToken");

console.log("Process Env MONGO_URI before override:", process.env.MONGO_URI ? "Set" : "Unset");
// Ensure configs has the URI even if configs.js failed to load it from CWD
configs.MONGO_URI = process.env.MONGO_URI;
configs.JWT_KEY = process.env.JWT_KEY;
configs.REFRESH_KEY = process.env.REFRESH_KEY;
configs.JWT_ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || "15m";

console.log("Configs injected from env:", {
    mongo: !!configs.MONGO_URI,
    jwt: !!configs.JWT_KEY,
    refresh: !!configs.REFRESH_KEY
});

const runVerification = async () => {
    try {
        await mongoose.connect(configs.MONGO_URI);
        console.log("Connected to DB");

        // 1. Create a Test User
        const email = `test_step24_${Date.now()}@example.com`;
        const user = await User.create({
            name: "Test User 24",
            email,
            password: "password123", // hashPasswd in pre-save or controller? 
            // In registerUser it hashes. Here we manually create, so password might be plain if we don't hash.
            // But getJWTFromRefresh doesn't check password.
            uid: `uid_${Date.now()}`,
            roles: ["admin"]
        });
        console.log("User created:", user.email);

        // 2. Generate a Refresh Token for this user
        const rtJwt = await getRefreshToken(user, "127.0.0.1");
        // rtJwt is the JWT string. The Handler expects `request.rtid` (decoded).
        // The middleware `verifyRefresh` does the decoding.
        // We need to simulate the middleware or manually decode.
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(rtJwt, configs.REFRESH_KEY);
        const rtid = decoded.rtid;

        console.log("Refresh Token generated. RTID:", rtid);

        // 3. Test Successful Refresh & Rotation
        console.log("\n--- Testing Successful Refresh & Rotation ---");
        const req1 = mockRequest({ refreshToken: rtJwt });
        req1.rtid = rtid; // Simulate middleware
        req1.cookies = { refreshToken: rtJwt };
        req1.unsignCookie = (c) => ({ valid: true, value: c });

        const rep1 = mockReply();

        await getJWTFromRefresh(req1, rep1);

        if (rep1.statusCode !== 200) {
            throw new Error(`Refresh failed: ${JSON.stringify(rep1.data)}`);
        }
        console.log("Refresh successful. New Access Token:", !!rep1.data.token);

        // Verify Rotation: Old Refresh Token must be revoked
        const oldRt = await RefreshToken.findOne({ rtid });
        if (!oldRt.isRevoked) {
            throw new Error("Old Refresh Token was NOT revoked! Strict rotation failed.");
        }
        console.log("Old Refresh Token revoked: YES");

        // 4. Test Deactivated User
        console.log("\n--- Testing Deactivated User Check ---");
        user.isDeactivated = true;
        await user.save();

        // Use the NEW refresh token from the previous step
        const newRtJwt = rep1.cookies.refreshToken; // handler sets cookie
        // Wait, handler sets cookie in `sendSuccessResponse`. `options.refreshToken`.
        if (!newRtJwt) {
            // Depending on config REFRESH_RESPONSE, it might be in data too?
            // authenticationHandler: line 1063: refreshToken: newRefreshToken
            // sendSuccessResponse: sets cookie.
            // Our mockReply captures cookies.
            throw new Error("New Refresh Token not found in response cookies");
        }

        const decoded2 = jwt.verify(newRtJwt, configs.REFRESH_KEY);
        const rtid2 = decoded2.rtid;

        const req2 = mockRequest({ refreshToken: newRtJwt });
        req2.rtid = rtid2;
        const rep2 = mockReply();

        await getJWTFromRefresh(req2, rep2);

        if (rep2.statusCode === 403 && rep2.data.message.includes("deactivated")) {
            console.log("Deactivation check passed (403 Forbidden).");
        } else {
            throw new Error(`Expected 403 Deactivated, got: ${rep2.statusCode} ${JSON.stringify(rep2.data)}`);
        }

        // Verify the token attempted during deactivation was ALSO revoked (hard security)
        const attemptedRt = await RefreshToken.findOne({ rtid: rtid2 });
        if (!attemptedRt.isRevoked) {
            console.warn("Notice: The refresh token used by deactivated user was not revoked. It should be revoked to prevent retry loops? Handler line 1056 says: rft.revoke... await rft.save(). Yes it should.");
            throw new Error("Token used by deactivated user was NOT revoked.");
        }
        console.log("Deactivated user's token revoked: YES");

        console.log("\nVERIFICATION PASSED ✅");

    } catch (e) {
        console.error("VERIFICATION FAILED ❌", e);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
};

runVerification();
