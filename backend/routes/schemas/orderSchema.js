const orderSchema = {
  createOrder: {
    description: "Create a new order for digital codes",
    tags: ["orders"],
    summary: "Create order",
    body: {
      type: "object",
      required: ["cartItems", "paymentMethod"],
      properties: {
        cartItems: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          items: {
            type: "object",
            required: ["listingId", "quantity"],
            properties: {
              listingId: {
                type: "string",
                description: "External ID (UUID) of the listing"
              },
              quantity: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                description: "Number of codes to purchase"
              }
            },
            additionalProperties: false
          }
        },
        paymentMethod: {
          type: "string",
          enum: ["stripe", "wallet"],
          description: "Payment method to use"
        }
      },
      additionalProperties: false
    },
    response: {
      201: {
        description: "Order created successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              orderId: { type: "string" },
              status: { type: "string" },
              totalAmount: { type: "number" },
              paymentMethod: { type: "string" },
              clientSecret: { type: "string" },
              paymentIntentId: { type: "string" }
            }
          }
        }
      },
      400: {
        description: "Bad request",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" },
          metadata: { type: "object" }
        }
      },
      401: {
        description: "Unauthorized",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      403: {
        description: "Forbidden",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      404: {
        description: "Not found",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      500: {
        description: "Internal server error",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" },
          metadata: { type: "object" }
        }
      }
    }
  },

  getBuyerOrders: {
    description: "Get orders for the authenticated buyer",
    tags: ["orders"],
    summary: "Get buyer orders",
    querystring: {
      type: "object",
      properties: {
        page: {
          type: "integer",
          minimum: 1,
          default: 1,
          description: "Page number"
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
          description: "Number of orders per page"
        },
        status: {
          type: "string",
          enum: ["pending", "processing", "completed", "failed", "refunded", "cancelled"],
          description: "Filter by order status"
        }
      },
      additionalProperties: false
    },
    response: {
      200: {
        description: "Orders retrieved successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              orders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    _id: { type: "string" },
                    externalId: { type: "string" },
                    orderItems: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          listingId: { type: "string" },
                          title: { type: "string" },
                          platform: { type: "string" },
                          region: { type: "string" },
                          quantity: { type: "number" },
                          unitPrice: { type: "number" },
                          totalPrice: { type: "number" },
                          listing: {
                            type: "object",
                            properties: {
                              _id: { type: "string" },
                              title: { type: "string" },
                              platform: { type: "string" },
                              region: { type: "string" },
                              description: { type: "string" },
                              thumbnailUrl: { type: "string" }
                            }
                          },
                          purchasedCodes: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                codeId: { type: "string" },
                                code: { type: "string" },
                                expirationDate: { type: "string" },
                                deliveredAt: { type: "string" }
                              }
                            }
                          }
                        }
                      }
                    },
                    seller: {
                      type: "object",
                      properties: {
                        name: { type: "string" }
                      }
                    },
                    totalAmount: { type: "number" },
                    currency: { type: "string" },
                    paymentMethod: { type: "string" },
                    status: { type: "string" },
                    deliveryStatus: { type: "string" },
                    createdAt: { type: "string" },
                    deliveredAt: { type: "string" }
                  }
                }
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  limit: { type: "number" },
                  total: { type: "number" },
                  pages: { type: "number" }
                }
              }
            }
          }
        }
      },
      401: {
        description: "Unauthorized",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      403: {
        description: "Forbidden",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      500: {
        description: "Internal server error",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      }
    }
  },

  getSellerOrders: {
    description: "Get orders for the authenticated seller",
    tags: ["orders"],
    summary: "Get seller orders",
    querystring: {
      type: "object",
      properties: {
        page: {
          type: "integer",
          minimum: 1,
          default: 1,
          description: "Page number"
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
          description: "Number of orders per page"
        },
        status: {
          type: "string",
          enum: ["pending", "processing", "completed", "failed", "refunded", "cancelled"],
          description: "Filter by order status"
        }
      },
      additionalProperties: false
    },
    response: {
      200: {
        description: "Orders retrieved successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              orders: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    _id: { type: "string" },
                    externalId: { type: "string" },
                    orderItems: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          listingId: { type: "string" },
                          title: { type: "string" },
                          platform: { type: "string" },
                          region: { type: "string" },
                          quantity: { type: "number" },
                          unitPrice: { type: "number" },
                          totalPrice: { type: "number" }
                        }
                      }
                    },
                    totalAmount: { type: "number" },
                    currency: { type: "string" },
                    paymentMethod: { type: "string" },
                    status: { type: "string" },
                    deliveryStatus: { type: "string" },
                    createdAt: { type: "string" },
                    deliveredAt: { type: "string" }
                  }
                }
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  limit: { type: "number" },
                  total: { type: "number" },
                  pages: { type: "number" }
                }
              }
            }
          }
        }
      },
      401: {
        description: "Unauthorized",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      403: {
        description: "Forbidden",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      500: {
        description: "Internal server error",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      }
    }
  },

  getBuyerPurchasedCodes: {
    description: "Get all purchased codes for the authenticated buyer",
    tags: ["orders"],
    summary: "Get buyer purchased codes",
    querystring: {
      type: "object",
      properties: {
        page: {
          type: "integer",
          minimum: 1,
          default: 1,
          description: "Page number"
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 20,
          description: "Number of codes per page"
        },
        search: {
          type: "string",
          description: "Search by product name, platform, or region"
        },
        sortBy: {
          type: "string",
          enum: ["createdAt", "productName", "platform"],
          default: "createdAt",
          description: "Sort by field"
        },
        sortOrder: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
          description: "Sort order"
        }
      },
      additionalProperties: false
    },
    response: {
      200: {
        description: "Purchased codes retrieved successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              codes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    _id: { type: "string" },
                    orderId: { type: "string" },
                    externalOrderId: { type: "string" },
                    productName: { type: "string" },
                    platform: { type: "string" },
                    region: { type: "string" },
                    codeId: { type: "string" },
                    code: { type: "string" },
                    expirationDate: { type: "string" },
                    purchaseDate: { type: "string" },
                    deliveredAt: { type: "string" }
                  }
                }
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "number" },
                  limit: { type: "number" },
                  total: { type: "number" },
                  pages: { type: "number" },
                  totalOrders: { type: "number" }
                }
              }
            }
          }
        }
      },
      401: {
        description: "Unauthorized",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      403: {
        description: "Forbidden",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      500: {
        description: "Internal server error",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      }
    }
  },

  getOrderById: {
    description: "Get a specific order by ID",
    tags: ["orders"],
    summary: "Get order by ID",
    params: {
      type: "object",
      required: ["orderId"],
      properties: {
        orderId: {
          type: "string",
          description: "Order ID (MongoDB ID or external UUID)"
        }
      },
      additionalProperties: false
    },
    response: {
      200: {
        description: "Order retrieved successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              order: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  externalId: { type: "string" },
                  orderItems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        listingId: { type: "string" },
                        title: { type: "string" },
                        platform: { type: "string" },
                        region: { type: "string" },
                        quantity: { type: "number" },
                        unitPrice: { type: "number" },
                        totalPrice: { type: "number" },
                        purchasedCodes: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              codeId: { type: "string" },
                              code: { type: "string" },
                              expirationDate: { type: "string" },
                              deliveredAt: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  },
                  totalAmount: { type: "number" },
                  currency: { type: "string" },
                  paymentMethod: { type: "string" },
                  status: { type: "string" },
                  deliveryStatus: { type: "string" },
                  createdAt: { type: "string" },
                  deliveredAt: { type: "string" }
                }
              }
            }
          }
        }
      },
      401: {
        description: "Unauthorized",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      403: {
        description: "Forbidden",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      404: {
        description: "Order not found",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      500: {
        description: "Internal server error",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      }
    }
  },

  decryptCode: {
    description: "Decrypt a specific activation code",
    tags: ["orders"],
    summary: "Decrypt activation code",
    body: {
      type: "object",
      required: ["codeId", "orderId"],
      properties: {
        codeId: {
          type: "string",
          description: "The ID of the code to decrypt"
        },
        orderId: {
          type: "string",
          description: "The ID of the order containing the code"
        }
      },
      additionalProperties: false
    },
    response: {
      200: {
        description: "Code decrypted successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              codeId: { type: "string" },
              decryptedCode: { type: "string" },
              expirationDate: { type: "string" }
            }
          }
        }
      },
      401: {
        description: "Unauthorized",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      403: {
        description: "Forbidden",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      404: {
        description: "Order or code not found",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      500: {
        description: "Internal server error",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      }
    }
  },

  hasUserPurchasedProduct: {
    description: "Check if user has purchased a specific product",
    tags: ["orders"],
    summary: "Check user purchase status",
    params: {
      type: "object",
      required: ["productId"],
      properties: {
        productId: {
          type: "string",
          description: "Product ID to check"
        }
      },
      additionalProperties: false
    },
    response: {
      200: {
        description: "Purchase status retrieved successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          hasPurchased: { type: "boolean" }
        }
      },
      401: {
        description: "Unauthorized",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      403: {
        description: "Forbidden",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      },
      500: {
        description: "Internal server error",
        type: "object",
        properties: {
          success: { type: "boolean" },
          error: { type: "string" }
        }
      }
    }
  }
};

module.exports = {
  orderSchema
};
