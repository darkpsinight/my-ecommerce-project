const platformSchema = {
  // Schema for adding a new platform to a category
  platformAdd: {
    description: "Add a new platform to a category",
    tags: ["admin", "platform"],
    summary: "Add a new platform to a category",
    params: {
      type: "object",
      required: ["categoryId"],
      properties: {
        categoryId: { type: "string", description: "ID of the category" }
      }
    },
    body: {
      type: "object",
      required: ["name"],
      properties: {
        name: { type: "string", minLength: 1 },
        description: { type: "string" },
        imageUrl: {
          type: "string",
          description: "Optional image URL for the platform"
        },
        patterns: {
          type: "array",
          items: {
            type: "object",
            required: ["regex", "description", "example"],
            properties: {
              regex: { type: "string" },
              description: { type: "string" },
              example: { type: "string" },
              isActive: { type: "boolean", default: true }
            }
          },
          default: []
        },
        isActive: { type: "boolean", default: true }
      }
    },
    response: {
      201: {
        type: "object",
        properties: {
          statusCode: { type: "number" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              imageUrl: { type: "string" },
              patterns: { type: "array" },
              isActive: { type: "boolean" }
            }
          }
        }
      }
    }
  },

  // Schema for getting all platforms in a category
  platformsGet: {
    description: "Get all platforms for a category",
    tags: ["admin", "platform"],
    summary: "Get all platforms for a category",
    params: {
      type: "object",
      required: ["categoryId"],
      properties: {
        categoryId: { type: "string", description: "ID of the category" }
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
                name: { type: "string" },
                description: { type: "string" },
                imageUrl: { type: "string" },
                patterns: { type: "array" },
                isActive: { type: "boolean" }
              }
            }
          }
        }
      }
    }
  },

  // Schema for getting a specific platform by name
  platformGet: {
    description: "Get a specific platform by name",
    tags: ["admin", "platform"],
    summary: "Get a specific platform by name",
    params: {
      type: "object",
      required: ["categoryId", "platformName"],
      properties: {
        categoryId: { type: "string", description: "ID of the category" },
        platformName: { type: "string", description: "Name of the platform" }
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
              name: { type: "string" },
              description: { type: "string" },
              imageUrl: { type: "string" },
              patterns: { type: "array" },
              isActive: { type: "boolean" }
            }
          }
        }
      }
    }
  },

  // Schema for updating a platform
  platformUpdate: {
    description: "Update a platform in a category",
    tags: ["admin", "platform"],
    summary: "Update a platform in a category",
    params: {
      type: "object",
      required: ["categoryId", "platformName"],
      properties: {
        categoryId: { type: "string", description: "ID of the category" },
        platformName: { type: "string", description: "Name of the platform to update" }
      }
    },
    body: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        description: { type: "string" },
        imageUrl: {
          type: "string",
          description: "Optional image URL for the platform"
        },
        patterns: {
          type: "array",
          items: {
            type: "object",
            required: ["regex", "description", "example"],
            properties: {
              regex: { type: "string" },
              description: { type: "string" },
              example: { type: "string" },
              isActive: { type: "boolean" }
            }
          }
        },
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
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              imageUrl: { type: "string" },
              patterns: { type: "array" },
              isActive: { type: "boolean" }
            }
          }
        }
      }
    }
  },

  // Schema for deleting a platform
  platformDelete: {
    description: "Delete a platform from a category",
    tags: ["admin", "platform"],
    summary: "Delete a platform from a category",
    params: {
      type: "object",
      required: ["categoryId", "platformName"],
      properties: {
        categoryId: { type: "string", description: "ID of the category" },
        platformName: { type: "string", description: "Name of the platform to delete" }
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
    }
  }
};

module.exports = {
  platformSchema
};
