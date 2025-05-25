const { configs } = require("../../configs");
const {
  responseErrors,
  jwtSecurity,
  getSuccessObject,
} = require("./common");

const errors = responseErrors;

const walletSchema = {
  // Get wallet information
  getWallet: {
    description: "Get user's wallet information including balance and recent transactions",
    tags: ["Wallet"],
    security: jwtSecurity,
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              wallet: {
                type: "object",
                properties: {
                  externalId: { type: "string" },
                  balance: { type: "number" },
                  currency: { type: "string" },
                  totalFunded: { type: "number" },
                  totalSpent: { type: "number" },
                  lastFundedAt: { type: "string", format: "date-time" },
                  lastSpentAt: { type: "string", format: "date-time" },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" }
                }
              },
              recentTransactions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    externalId: { type: "string" },
                    type: { type: "string" },
                    amount: { type: "number" },
                    currency: { type: "string" },
                    status: { type: "string" },
                    description: { type: "string" },
                    createdAt: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          }
        }
      },
      ...errors
    }
  },

  // Create payment intent for wallet funding
  createPaymentIntent: {
    description: "Create a Stripe payment intent for wallet funding",
    tags: ["Wallet"],
    security: jwtSecurity,
    body: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          minimum: configs.WALLET_MIN_FUNDING_AMOUNT,
          maximum: configs.WALLET_MAX_FUNDING_AMOUNT,
          example: 50
        },
        currency: {
          type: "string",
          enum: ["USD", "EUR", "GBP"],
          default: configs.WALLET_DEFAULT_CURRENCY
        }
      },
      required: ["amount"],
      additionalProperties: false
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              clientSecret: { type: "string" },
              paymentIntentId: { type: "string" },
              amount: { type: "number" },
              currency: { type: "string" }
            }
          }
        }
      },
      ...errors
    }
  },

  // Confirm payment and update wallet
  confirmPayment: {
    description: "Confirm payment and update wallet balance",
    tags: ["Wallet"],
    security: jwtSecurity,
    body: {
      type: "object",
      properties: {
        paymentIntentId: {
          type: "string",
          example: "pi_1234567890"
        }
      },
      required: ["paymentIntentId"],
      additionalProperties: false
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              transaction: {
                type: "object",
                properties: {
                  externalId: { type: "string" },
                  type: { type: "string" },
                  amount: { type: "number" },
                  currency: { type: "string" },
                  status: { type: "string" },
                  description: { type: "string" },
                  createdAt: { type: "string", format: "date-time" }
                }
              },
              newBalance: { type: "number" }
            }
          }
        }
      },
      ...errors
    }
  },

  // Get transaction history
  getTransactions: {
    description: "Get user's wallet transaction history with pagination",
    tags: ["Wallet"],
    security: jwtSecurity,
    querystring: {
      type: "object",
      properties: {
        page: {
          type: "integer",
          minimum: 1,
          default: 1
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 20
        },
        type: {
          type: "string",
          enum: ["funding", "purchase", "refund", "withdrawal"]
        },
        status: {
          type: "string",
          enum: ["pending", "completed", "failed", "cancelled", "refunded"]
        }
      },
      additionalProperties: false
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              transactions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    externalId: { type: "string" },
                    type: { type: "string" },
                    amount: { type: "number" },
                    currency: { type: "string" },
                    status: { type: "string" },
                    description: { type: "string" },
                    balanceBefore: { type: "number" },
                    balanceAfter: { type: "number" },
                    createdAt: { type: "string", format: "date-time" },
                    processedAt: { type: "string", format: "date-time" }
                  }
                }
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  total: { type: "integer" },
                  pages: { type: "integer" }
                }
              }
            }
          }
        }
      },
      ...errors
    }
  }
};

module.exports = {
  walletSchema
};
