const mongoose = require('mongoose');
const { configs } = require('../configs');
// Defer require of Listing to avoid circular dep issues if any remaining, though configs is likely cached now.
const { Listing } = require('../models/listing');

async function fixInvalidListing() {
    console.log('Current directory:', process.cwd());
    require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

    // Ensure URI is set
    const uri = configs.MONGO_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI is missing');
        return;
    }

    if (!configs.MONGO_URI) configs.MONGO_URI = uri; // Set it for Mongoose if it uses configs internally

    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const listingId = '68822d55aa37337392f8237a';
        const result = await Listing.deleteOne({ _id: listingId });

        if (result.deletedCount === 1) {
            console.log(`Successfully deleted invalid listing ${listingId}`);
        } else {
            console.log(`Listing ${listingId} not found or already deleted`);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}

fixInvalidListing();
