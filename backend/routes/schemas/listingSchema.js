const listingSchema = {
  // Schema for creating a new listing
  createListing: {
    body: {
      type: "object",
      required: ["title", "description", "price", "category", "platform", "region", "code"],
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
        category: { 
          type: "string", 
          enum: ["Gift Card", "Game Key", "Software License", "Subscription", "In-Game Currency", "Other"],
          description: "Type of code"
        },
        platform: { 
          type: "string", 
          enum: ["Steam", "Xbox", "PlayStation", "Nintendo", "Epic Games", "Origin", "Uplay", "GOG", "Battle.net", "iTunes", "Google Play", "Other"],
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
        category: { 
          type: "string", 
          enum: ["Gift Card", "Game Key", "Software License", "Subscription", "In-Game Currency", "Other"],
          description: "Type of code"
        },
        platform: { 
          type: "string", 
          enum: ["Steam", "Xbox", "PlayStation", "Nintendo", "Epic Games", "Origin", "Uplay", "GOG", "Battle.net", "iTunes", "Google Play", "Amazon", "Other"],
          description: "Platform/Store where the code is redeemed"
        },
        region: { 
          type: "string", 
          enum: ["Global", "North America", "Europe", "Asia", "Oceania", "South America", "Africa", "Other"],
          description: "Region for the code"
        },
        isRegionLocked: { 
          type: "boolean",
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
          minimum: 0,
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
          description: "Current status of the listing"
        }
      }
    }
  },

  // Schema for deleting a listing
  deleteListing: {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { 
          type: "string",
          description: "Listing ID"
        }
      }
    }
  },

  // Schema for getting all listings with filters
  getListings: {
    querystring: {
      type: "object",
      properties: {
        category: { 
          type: "string",
          description: "Filter by category"
        },
        platform: { 
          type: "string",
          description: "Filter by platform"
        },
        region: { 
          type: "string",
          description: "Filter by region"
        },
        minPrice: { 
          type: "number",
          description: "Minimum price"
        },
        maxPrice: { 
          type: "number",
          description: "Maximum price"
        },
        sellerId: { 
          type: "string",
          description: "Filter by seller ID"
        },
        status: { 
          type: "string",
          description: "Filter by status"
        },
        page: { 
          type: "integer", 
          default: 1,
          description: "Page number for pagination"
        },
        limit: { 
          type: "integer", 
          default: 10,
          description: "Number of items per page"
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
        id: { 
          type: "string",
          description: "Listing ID"
        }
      }
    }
  },

  // Schema for bulk upload of listings
  bulkCreateListings: {
    body: {
      type: "object",
      required: ["listingTemplate", "codes"],
      properties: {
        listingTemplate: {
          type: "object",
          required: ["title", "description", "price", "category", "platform", "region"],
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
            category: { 
              type: "string", 
              enum: ["Gift Card", "Game Key", "Software License", "Subscription", "In-Game Currency", "Other"],
              description: "Type of code"
            },
            platform: { 
              type: "string", 
              enum: ["Steam", "Xbox", "PlayStation", "Nintendo", "Epic Games", "Origin", "Uplay", "GOG", "Battle.net", "iTunes", "Google Play", "Amazon", "Other"],
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
