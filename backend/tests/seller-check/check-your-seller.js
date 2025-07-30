const mongoose = require("mongoose");
const { User } = require("../../models/user");
const { Listing } = require("../../models/listing");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

setTimeout(async () => {
  try {
    // Find YOUR seller account
    const seller = await User.findOne({ email: "darkpsinight@gmail.com" });
    console.log("Your seller account:", seller?.email, "UID:", seller?.uid);

    if (!seller) {
      console.log("❌ Seller not found with email: darkpsinight@gmail.com");
      mongoose.connection.close();
      return;
    }

    // Find YOUR listings
    const listings = await Listing.find({ sellerId: seller.uid })
      .select("externalId title platform")
      .limit(10);
    console.log(`\nYour listings (${listings.length} found):`);
    listings.forEach((listing, index) => {
      console.log(
        `  ${index + 1}. ${listing.title} (ID: ${listing.externalId}) - ${
          listing.platform
        }`
      );
    });

    if (listings.length > 0) {
      console.log("\n✅ Perfect! Now I can create CTR data for YOUR listings.");
      console.log(
        `We'll use listing: ${listings[0].externalId} (${listings[0].title})`
      );
    } else {
      console.log("\n❌ No listings found for your seller account.");
    }

    mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error.message);
    mongoose.connection.close();
  }
}, 1000);
