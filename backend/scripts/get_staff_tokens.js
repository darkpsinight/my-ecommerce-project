require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { User } = require('../models/user');
const { configs } = require('../configs');

async function main() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const usersToFind = [
            { email: 'admin@test.com', label: 'ADMIN' },
            { email: 'support@test.com', label: 'SUPPORT' }
        ];

        for (const target of usersToFind) {
            const user = await User.findOne({ email: target.email });

            if (!user) {
                console.log(`\n❌ User ${target.email} not found. Run 'node backend/scripts/createTestSupportAdmin.js' first.`);
                continue;
            }

            // Payload matches verifyAuth expectations
            const payload = {
                uid: user.uid,
                _id: user._id,
                email: user.email,
                roles: user.roles
            };

            const token = jwt.sign(payload, process.env.JWT_KEY || configs.JWT_KEY, { expiresIn: '24h' });

            console.log(`\n>>> ${target.label} TOKEN (${target.email}) <<<`);
            console.log(token);
            console.log('---------------------------------------------------');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
