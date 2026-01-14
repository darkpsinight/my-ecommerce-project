const mongoose = require('mongoose');
const { configs } = require('../configs');
const { Listing } = require('../models/listing');

async function findInvalidListings() {
    console.log('Current directory:', process.cwd());
    require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
    console.log('MONGO_URI from env:', process.env.MONGO_URI ? 'Defined' : 'Undefined');
    // Re-require configs after loading env if needed, or just use process.env if configs.js is already cached with undefined

    // Actually, configs.js is already cached. We might need to manually set it.
    if (!configs.MONGODB_URI && process.env.MONGO_URI) {
        console.log('Manually setting MONGODB_URI to configs');
        // configs is a const exported object, we can modify its properties
        // But configs.js maps MONGO_URI to configs.MONGO_URI usually.
        // Let's check configs.js again. It uses configs.MONGO_URI (line 11).
        // Oh wait, in the script I used configs.MONGODB_URI... let me check my script.
    }

    try {
        const uri = configs.MONGO_URI || process.env.MONGO_URI;
        console.log('Connecting to:', uri ? 'URI found' : 'No URI');
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const listings = await Listing.find({}).select('+codes');
        console.log(`Found ${listings.length} listings total. Checking for validity...`);

        let invalidCount = 0;
        for (const listing of listings) {
            const issues = [];

            if (!listing.categoryId) {
                issues.push('Missing categoryId');
            }

            if (listing.codes && listing.codes.length > 0) {
                listing.codes.forEach((code, index) => {
                    if (!code.hashCode) {
                        issues.push(`Missing hashCode at code index ${index}`);
                    }
                });
            }

            if (issues.length > 0) {
                console.log(`\nListing ID: ${listing._id}, Title: "${listing.title}"`);
                console.log('Issues:', issues);
                invalidCount++;
            }
        }

        console.log(`\nTotal invalid listings found: ${invalidCount}`);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

findInvalidListings();
