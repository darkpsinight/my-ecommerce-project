const patternProperties = {
  regex: { type: "string" },
  description: { type: "string" },
  example: { type: "string" },
  isActive: { type: "boolean" }
};

const subcategoryProperties = {
  name: { type: "string" },
  description: { type: "string" },
  imageUrl: {
    type: "string",
    description: "Optional image URL for the platform"
  },
  patterns: {
    type: "array",
    items: {
      type: "object",
      properties: patternProperties
      // No required fields
    }
  },
  isActive: { type: "boolean" }
};

const categoryProperties = {
  name: { type: "string" },
  description: { type: "string" },
  imageUrl: {
    type: "string",
    description: "Optional image URL for the category"
  },
  platforms: {
    type: "array",
    items: {
      type: "object",
      properties: subcategoryProperties,
      required: ["name"]
    }
  },
  isActive: { type: "boolean" }
};

const categorySchema = {
  // Create category
  categoryCreate: {
    description: "Create a new category",
    tags: ["admin", "category"],
    summary: "Create a new category (Admin only)",
    body: {
      type: "object",
      required: ["name"],
      properties: categoryProperties
    },
    response: {
      200: {
        type: "object",
        properties: {
          statusCode: { type: "number" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              ...categoryProperties,
              _id: { type: "string" },
              createdAt: { type: "string" },
              updatedAt: { type: "string" }
            }
          }
        }
      }
    },
    security: [{ JWTToken: [] }]
  },

  // Get all categories
  categoriesGet: {
    description: "Get all categories",
    tags: ["admin", "category"],
    summary: "Get all categories (Admin only)",
    querystring: {
      type: "object",
      properties: {
        page: { type: "number", default: 1 },
        limit: { type: "number", default: 10 },
        isActive: { type: "boolean" }
      }
    },
    response: {
      200: {
        type: "object",
        properties: {
          statusCode: { type: "number" },
          message: { type: "string" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ...categoryProperties,
                _id: { type: "string" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" }
              }
            }
          },
          pagination: {
            type: "object",
            properties: {
              total: { type: "number" },
              page: { type: "number" },
              limit: { type: "number" },
              pages: { type: "number" }
            }
          }
        }
      }
    },
    security: [{ JWTToken: [] }]
  },

  // Get a single category by ID
  categoryGet: {
    description: "Get a category by ID",
    tags: ["admin", "category"],
    summary: "Get a category by ID (Admin only)",
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" }
      }
    },
    response: {
      200: {
        type: "object",
        properties: {
          statusCode: { type: "number" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              ...categoryProperties,
              _id: { type: "string" },
              createdAt: { type: "string" },
              updatedAt: { type: "string" }
            }
          }
        }
      }
    },
    security: [{ JWTToken: [] }]
  },

  // Update a category
  categoryUpdate: {
    description: "Update a category",
    tags: ["admin", "category"],
    summary: "Update a category (Admin only)",
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" }
      }
    },
    body: {
      type: "object",
      properties: categoryProperties
    },
    response: {
      200: {
        type: "object",
        properties: {
          statusCode: { type: "number" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              ...categoryProperties,
              _id: { type: "string" },
              createdAt: { type: "string" },
              updatedAt: { type: "string" }
            }
          }
        }
      }
    },
    security: [{ JWTToken: [] }]
  },

  // Delete a category
  categoryDelete: {
    description: "Delete a category",
    tags: ["admin", "category"],
    summary: "Delete a category (Admin only)",
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string" }
      }
    },
    response: {
      200: {
        type: "object",
        properties: {
          statusCode: { type: "number" },
          message: { type: "string" }
        }
      }
    },
    security: [{ JWTToken: [] }]
  }
};

module.exports = {
  categorySchema
};
