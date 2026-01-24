require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { User } = require('../models/user');
const { configs } = require('../configs');
const { v4: uuidv4 } = require('uuid');

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Find Specific Buyer
        const buyerEmail = 'buyer@test.com';
        let buyer = await User.findOne({ email: buyerEmail });

        if (!buyer) {
            console.error(`❌ User with email ${buyerEmail} not found in database.`);
            process.exit(1);
        }

        console.log(`✅ Found existing buyer: ${buyer.uid} (${buyer._id})`);

        // 2. Generate Token
        // Payload must match what verifyAuth expects: { uid, email, roles }
        const payload = {
            uid: buyer.uid,
            _id: buyer._id, // Some legacy might use _id
            email: buyer.email,
            roles: buyer.roles
        };

        const token = jwt.sign(payload, process.env.JWT_KEY, { expiresIn: '1h' });

        console.log('\n>>> BUYER TOKEN <<<');
        console.log(token);
        console.log('>>> END TOKEN <<<\n');

        console.log('Use this token in Postman Authorization header as: Bearer <token>');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();
