const { Listing } = require("../models/listing");
const { checkForDuplicateCodes } = require("./listingHandlers");
const csvParser = require('csv-parser');
const { Readable } = require('stream');

/**
 * Parse CSV data into an array of code objects
 * @param {string} csvData - CSV data as a string
 * @returns {Promise<Array>} - Array of code objects with code and optional expirationDate
 */
const parseCSVData = async (csvData) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const headers = new Set();
    
    // Create a readable stream from the CSV string
    const stream = Readable.from([csvData]);
    
    stream
      .pipe(csvParser())
      .on('headers', (headerList) => {
        // Check if required headers exist
        headerList.forEach(header => headers.add(header.toLowerCase().trim()));
        
        if (!headers.has('code')) {
          reject(new Error('CSV must contain a "code" column'));
        }
      })
      .on('data', (data) => {
        // Normalize column names to lowercase
        const normalizedData = {};
        Object.keys(data).forEach(key => {
          normalizedData[key.toLowerCase().trim()] = data[key];
        });
        
        const code = normalizedData.code?.trim();
        
        // Skip empty codes
        if (!code) return;
        
        // Create code object
        const codeObj = { code };
        
        // Add expiration date if present
        if (normalizedData.expirationdate) {
          const expirationDate = normalizedData.expirationdate.trim();
          if (expirationDate) {
            // Convert to ISO format if it's not already
            if (expirationDate.includes('T')) {
              codeObj.expirationDate = expirationDate;
            } else {
              // Add time component to make it a valid ISO date
              codeObj.expirationDate = `${expirationDate}T23:59:59.999Z`;
            }
          }
        }
        
        results.push(codeObj);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

/**
 * Upload codes from CSV to a listing
 * @param {Object} request - Fastify request object
 * @param {Object} reply - Fastify reply object
 * @returns {Promise<Object>} - Response object
 */
const uploadCodesCSV = async (request, reply) => {
  try {
    const { id } = request.params;
    const { csvData } = request.body;
    const sellerId = request.user.uid;
    
    // Check if CSV data is provided
    if (!csvData) {
      return reply.code(400).send({
        success: false,
        message: "CSV data is required"
      });
    }
    
    // Parse CSV data
    let codes;
    try {
      codes = await parseCSVData(csvData);
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: `Failed to parse CSV data: ${error.message}`
      });
    }
    
    // Check if any codes were found
    if (!codes || codes.length === 0) {
      return reply.code(400).send({
        success: false,
        message: "No valid codes found in the CSV data"
      });
    }
    
    // Check if user is admin (admins can update any listing)
    const isAdmin = request.user.role === "admin";
    
    // Query to find the listing - use externalId instead of _id
    const query = isAdmin ? { externalId: id } : { externalId: id, sellerId };
    
    // Find the listing
    const listing = await Listing.findOne(query);
    
    if (!listing) {
      return reply.code(404).send({
        success: false,
        error: "Listing not found or you don't have permission to update it"
      });
    }
    
    // Extract code strings for duplicate checking
    const codeStrings = codes.map(codeObj => codeObj.code);
    
    // Check for duplicate codes
    const duplicateCheck = await checkForDuplicateCodes(codeStrings, id);
    
    if (!duplicateCheck.success) {
      // Found duplicate codes
      return reply.code(400).send({
        success: false,
        message: "Validation failed: One or more codes already exist in another listing",
        error: {
          duplicates: duplicateCheck.duplicates.map(dup => ({
            code: dup.code,
            listingTitle: dup.listingTitle,
            sellerId: dup.sellerId
          }))
        }
      });
    }
    
    // Add the codes to the listing
    listing.addCodes(codes);
    
    // Save the listing
    await listing.save();
    
    return reply.code(200).send({
      success: true,
      message: `Successfully added ${codes.length} codes to the listing`,
      data: {
        listingId: listing.externalId,
        title: listing.title,
        codesAdded: codes.length,
        totalCodes: listing.codes.length
      }
    });
  } catch (error) {
    request.log.error(`Error uploading codes CSV: ${error.message}`);
    return reply.code(500).send({
      success: false,
      error: "Failed to upload codes",
      message: error.message
    });
  }
};

module.exports = {
  uploadCodesCSV,
  parseCSVData
};
