const listingSchema = {
  // Schema for creating a new listing
  createListing: {
    body: {
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
        // Legacy fields - to be deprecated
        code: {
          type: "string",
          description: "The actual code (will be encrypted) - Legacy field, use codes array instead"
        },
        codeExpirationDate: {
          type: "string",
          format: "date-time",
          description: "If the code has a validity period - Legacy field, use codes array instead"
        },
        // Field for additional codes when using the legacy format
        additionalCodes: {
          type: "array",
          items: {
            type: "object",
            required: ["code"],
            properties: {
              code: {
                type: "string",
                description: "The additional code (will be encrypted)"
              },
              expirationDate: {
                type: "string",
                format: "date-time",
                description: "Optional expiration date for this specific code"
              }
            }
          },
          description: "Array of additional codes with optional individual expiration dates (used with legacy code field)"
        },
        // New field for adding multiple codes with individual expiration dates
        codes: {
          type: "array",
          items: {
            type: "object",
            required: ["code"],
            properties: {
              code: {
                type: "string",
                description: "The actual code (will be encrypted)"
              },
              expirationDate: {
                type: "string",
                format: "date-time",
                description: "Optional expiration date for this specific code"
              }
            }
          },
          description: "Array of codes with optional individual expiration dates"
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
          description: "Listing external ID (UUID)"
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
        // Legacy fields - to be deprecated
        code: { type: "string" },
        codeExpirationDate: { type: "string", format: "date-time" },
        // Field for additional codes when using the legacy format
        additionalCodes: {
          type: "array",
          items: {
            type: "object",
            required: ["code"],
            properties: {
              code: { type: "string" },
              expirationDate: { type: "string", format: "date-time" }
            }
          },
          description: "Array of additional codes with optional individual expiration dates (used with legacy code field)"
        },
        // New field for adding multiple codes with individual expiration dates
        codes: {
          type: "array",
          items: {
            type: "object",
            required: ["code"],
            properties: {
              code: { type: "string" },
              expirationDate: { type: "string", format: "date-time" }
            }
          }
        },
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
        id: {
          type: "string",
          description: "Listing external ID (UUID)"
        }
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
        categoryId: {
          type: "string",
          description: "Category ID to filter by or 'all' to show all categories"
        },
        platform: {
          type: "string",
          description: "Platform to filter by or 'all' to show all platforms"
        },
        region: { type: "string" },
        minPrice: { type: "number" },
        maxPrice: { type: "number" },
        startDate: { type: "string", format: "date-time" },
        endDate: { type: "string", format: "date-time" },
        title: { type: "string" },
        sortBy: {
          type: "string",
          enum: ["title", "platform", "quantity", "price", "status", "createdAt"],
          default: "createdAt"
        },
        sortOrder: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc"
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
          description: "Listing external ID (UUID)"
        }
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
            codeExpirationDate: {
              type: "string",
              format: "date-time",
              description: "If the codes have a validity period (applies to all codes in the bulk creation)"
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
        // Legacy field - simple array of strings
        codes: {
          type: "array",
          items: {
            oneOf: [
              { type: "string" },
              {
                type: "object",
                required: ["code"],
                properties: {
                  code: { type: "string" },
                  expirationDate: { type: "string", format: "date-time" }
                }
              }
            ]
          },
          minItems: 1,
          description: "Array of codes to add to the listing. Can be strings or objects with code and optional expirationDate."
        }
      }
    }
  },
  // Schema for uploading codes via CSV
  uploadCodesCSV: {
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          description: "Listing external ID (UUID)"
        }
      }
    },
    body: {
      type: "object",
      properties: {
        csvData: {
          type: "string",
          description: "CSV data as a string with code and optional expirationDate columns"
        }
      }
    }
  },
  // Schema for checking if a code exists
  checkCodeExists: {
    body: {
      type: "object",
      required: ["code"],
      properties: {
        code: {
          type: "string",
          description: "The code to check for existence in the database"
        }
      }
    },
    querystring: {
      type: "object",
      properties: {
        excludeListingId: {
          type: "string",
          description: "Optional listing ID to exclude from the check (for updates)"
        }
      }
    }
  }
};

module.exports = {
  listingSchema
};
