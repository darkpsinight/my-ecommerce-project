const configSchema = {
  configsGet: {
    response: {
      200: {
        type: "object",
        properties: {
          statusCode: { type: "number" },
          message: { type: "string" },
          configs: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                key: { type: "string" },
                value: { type: "string" },
                description: { type: "string" },
                category: {
                  type: "string",
                  enum: [
                    "email",
                    "security",
                    "application",
                    "authentication",
                    "rate_limiting",
                    "oauth",
                    "system",
                    "payment",
                    "feature_flag",
                  ],
                },
                isPublic: { type: "boolean" },
                lastModifiedBy: { type: "string" },
                lastModifiedAt: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
  configUpdate: {
    body: {
      type: "object",
      required: ["key", "value", "description", "category"],
      properties: {
        key: { type: "string" },
        value: { type: "string" },
        description: { type: "string" },
        category: {
          type: "string",
          enum: [
            "email",
            "security",
            "application",
            "authentication",
            "rate_limiting",
            "oauth",
            "system",
            "payment",
            "feature_flag",
          ],
        },
        isPublic: { type: "boolean" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          statusCode: { type: "number" },
          message: { type: "string" },
          config: {
            type: "object",
            properties: {
              key: { type: "string" },
              value: { type: "string" },
              description: { type: "string" },
              category: {
                type: "string",
                enum: [
                  "email",
                  "security",
                  "application",
                  "authentication",
                  "rate_limiting",
                  "oauth",
                  "system",
                  "payment",
                  "feature_flag",
                ],
              },
              isPublic: { type: "boolean" },
              lastModifiedBy: { type: "string" },
              lastModifiedAt: { type: "string" },
            },
          },
        },
      },
    },
  },
  configDelete: {
    params: {
      type: "object",
      required: ["key"],
      properties: {
        key: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          statusCode: { type: "number" },
          message: { type: "string" },
        },
      },
    },
  },
};

module.exports = {
  configSchema,
};
