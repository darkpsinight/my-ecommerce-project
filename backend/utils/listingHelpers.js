/**
 * Utility functions for handling listing operations
 */

/**
 * Checks if a listing is expired and updates its status in the response
 * This function modifies the listing object directly
 * 
 * @param {Object} listing - The listing object to check
 * @returns {Boolean} - True if the listing was expired and updated, false otherwise
 */
const checkAndUpdateExpiredStatus = (listing) => {
  // Skip if listing is already expired or has no expiration date
  if (!listing || listing.status === 'expired' || !listing.expirationDate) {
    return false;
  }
  
  const now = new Date();
  const expirationDate = new Date(listing.expirationDate);
  
  // Check if expiration date has passed
  if (expirationDate < now && listing.status === 'active') {
    // Update the status to expired in the response
    listing.status = 'expired';
    listing.updatedAt = now;
    
    // Also update the soldStatus of any active codes to expired
    if (listing.codes && listing.codes.length > 0) {
      for (const code of listing.codes) {
        if (code.soldStatus === 'active') {
          code.soldStatus = 'expired';
        }
      }
    }
    
    return true;
  }
  
  return false;
};

/**
 * Processes an array of listings to check for expired items
 * Updates their status in the response if needed
 * 
 * @param {Array} listings - Array of listing objects
 * @param {Object} fastify - Fastify instance for logging (optional)
 * @returns {Number} - Number of listings that were updated
 */
const processListingsExpiration = (listings, fastify = null) => {
  if (!Array.isArray(listings) || listings.length === 0) {
    return 0;
  }
  
  let updatedCount = 0;
  
  listings.forEach(listing => {
    if (checkAndUpdateExpiredStatus(listing)) {
      updatedCount++;
    }
  });
  
  if (updatedCount > 0 && fastify) {
    fastify.log.info(`Real-time expiration check: Updated ${updatedCount} listings in response`);
  }
  
  return updatedCount;
};

module.exports = {
  checkAndUpdateExpiredStatus,
  processListingsExpiration
};
