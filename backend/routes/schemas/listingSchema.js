const listingSchema = {
  // Schema for creating a new listing
  createListing: {
    body: {
      type: "object",
      required: ["title", "description", "price", "categoryId", "platform", "region", "code"],
      properties: {
        title: { 
          type: "string", 
          maxLength: 100,
          description: "Short, descriptive name of the listing"
        },
        description: { 
          type: "string",
          description: "Details about the code, including what it unlocks, terms, and any restrictions"
        },
        price: { 
          type: "number", 
          minimum: 0,
          description: "Listing price"
        },
        originalPrice: { 
          type: "number", 
          minimum: 0,
          description: "Original price to show discount"
        },
        categoryId: {
          type: "string", 
          pattern: "^[0-9a-fA-F]{24}$",
          description: "MongoDB ID of the category"
        },
        platform: { 
          type: "string",
          description: "Platform/Store where the code is redeemed"
        },
        region: { 
          type: "string", 
          enum: ["Global", "North America", "Europe", "Asia", "Oceania", "South America", "Africa", "Other"],
          description: "Region for the code"
        },
        isRegionLocked: { 
          type: "boolean",
          default: false,
          description: "Specify if the code is region-locked"
        },
        code: { 
          type: "string",
          description: "The actual code (will be encrypted)"
        },
        expirationDate: { 
          type: "string", 
          format: "date-time",
          description: "If the code has a validity period"
        },
        quantity: { 
          type: "integer", 
          minimum: 1,
          default: 1,
          description: "Stock count"
        },
        supportedLanguages: { 
          type: "array", 
          items: { type: "string" },
          description: "If the code is language-specific"
        },
        thumbnailUrl: { 
          type: "string",
          description: "Optional image URL"
        },
        autoDelivery: { 
          type: "boolean",
          default: false,
          description: "Toggle for instant delivery"
        },
        tags: { 
          type: "array", 
          items: { type: "string" },
          description: "Keywords for searchability"
        },
        sellerNotes: { 
          type: "string",
          description: "Private notes for internal use"
        },
        status: { 
          type: "string", 
          enum: ["active", "sold", "expired", "suspended", "draft"],
          default: "active",
          description: "Current status of the listing"
        }
      }
    }
  },

  // Schema for updating an existing listing
  updateListing: {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { 
          type: "string",
          description: "Listing ID"
        }
      }
    },
    body: {
      type: "object",
      properties: {
        title: { type: "string", maxLength: 100 },
        description: { type: "string" },
        price: { type: "number", minimum: 0 },
        originalPrice: { type: "number", minimum: 0 },
        // Legacy field - to be deprecated
        category: { 
          type: "string", 
          enum: ["Gift Card", "Game Key", "Software License", "Subscription", "In-Game Currency", "Other"]
        },
        // New field referencing category document
        categoryId: {
          type: "string", 
          pattern: "^[0-9a-fA-F]{24}$",
          description: "MongoDB ID of the category"
        },
        platform: { 
          type: "string"
        },
        region: { 
          type: "string", 
          enum: ["Global", "North America", "Europe", "Asia", "Oceania", "South America", "Africa", "Other"]
        },
        isRegionLocked: { type: "boolean" },
        code: { type: "string" },
        expirationDate: { type: "string", format: "date-time" },
        quantity: { type: "integer", minimum: 1 },
        supportedLanguages: { type: "array", items: { type: "string" } },
        thumbnailUrl: { type: "string" },
        autoDelivery: { type: "boolean" },
        tags: { type: "array", items: { type: "string" } },
        sellerNotes: { type: "string" },
        status: { 
          type: "string", 
          enum: ["active", "sold", "expired", "suspended", "draft"]
        }
      }
    }
  },

  // Schema for getting a single listing
  getListing: {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" }
      }
    }
  },
  
  // Schema for getting multiple listings
  getListings: {
    querystring: {
      type: "object",
      properties: {
        page: { type: "number", default: 1 },
        limit: { type: "number", default: 10 },
        status: { 
          type: "string", 
          enum: ["active", "sold", "expired", "suspended", "draft"]
        },
        sellerId: { type: "string" },
        categoryId: { type: "string", pattern: "^[0-9a-fA-F]{24}$" },
        platform: { type: "string" }
      }
    }
  },
  
  // Schema for deleting a listing
  deleteListing: {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" }
      }
    }
  },
  
  // Schema for bulk creating listings from a template
  bulkCreateListings: {
    body: {
      type: "object",
      required: ["listingTemplate", "codes"],
      properties: {
        listingTemplate: {
          type: "object",
          required: ["title", "description", "price", "categoryId", "platform", "region"],
          properties: {
            title: { 
              type: "string", 
              maxLength: 100,
              description: "Short, descriptive name of the listing"
            },
            description: { 
              type: "string",
              description: "Details about the code, including what it unlocks, terms, and any restrictions"
            },
            price: { 
              type: "number", 
              minimum: 0,
              description: "Listing price"
            },
            originalPrice: { 
              type: "number", 
              minimum: 0,
              description: "Original price to show discount"
            },
            // Legacy field - to be deprecated
            category: { 
              type: "string", 
              enum: ["Gift Card", "Game Key", "Software License", "Subscription", "In-Game Currency", "Other"],
              description: "Type of code (legacy field)"
            },
            // New field referencing category document
            categoryId: {
              type: "string", 
              pattern: "^[0-9a-fA-F]{24}$",
              description: "MongoDB ID of the category"
            },
            platform: { 
              type: "string",
              description: "Platform/Store where the code is redeemed"
            },
            region: { 
              type: "string", 
              enum: ["Global", "North America", "Europe", "Asia", "Oceania", "South America", "Africa", "Other"],
              description: "Region for the code"
            },
            isRegionLocked: { 
              type: "boolean",
              default: false,
              description: "Specify if the code is region-locked"
            },
            expirationDate: { 
              type: "string", 
              format: "date-time",
              description: "If the code has a validity period"
            },
            supportedLanguages: { 
              type: "array", 
              items: { type: "string" },
              description: "If the code is language-specific"
            },
            thumbnailUrl: { 
              type: "string",
              description: "Optional image URL"
            },
            autoDelivery: { 
              type: "boolean",
              default: false,
              description: "Toggle for instant delivery"
            },
            tags: { 
              type: "array", 
              items: { type: "string" },
              description: "Keywords for searchability"
            },
            sellerNotes: { 
              type: "string",
              description: "Private notes for internal use"
            },
            status: { 
              type: "string", 
              enum: ["active", "sold", "expired", "suspended", "draft"],
              default: "active",
              description: "Current status of the listing"
            }
          }
        },
        codes: { 
          type: "array", 
          items: { type: "string" },
          minItems: 1,
          description: "Array of codes to create listings for"
        }
      }
    }
  }
};

module.exports = {
  listingSchema
};
