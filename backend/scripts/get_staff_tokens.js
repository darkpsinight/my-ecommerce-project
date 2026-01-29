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

        console.log('\nFetching all users from database...');
        const users = await User.find({});
        console.log(`Found ${users.length} users.`);
        console.log('===================================================');

        if (users.length === 0) {
            console.log("No users found in the database.");
        }

        for (const user of users) {
            const payload = {
                uid: user.uid,
                _id: user._id,
                email: user.email,
                roles: user.roles
            };

            const token = jwt.sign(payload, process.env.JWT_KEY || configs.JWT_KEY, { expiresIn: '24h' });

            console.log(`\nUser: ${user.email}`);
            console.log(`Roles: [${user.roles.join(', ')}]`);
            console.log('Token:');
            console.log(token);
            console.log('---------------------------------------------------');
        }

        console.log("DONE");
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        // Ensure connection is closed
        await mongoose.connection.close();
    }
}

main();
