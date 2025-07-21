// JSON Schema definitions for viewed products API

const metadataSchema = {
  type: 'object',
  properties: {
    source: {
      type: 'string',
      enum: ['homepage', 'search', 'category', 'recommendation', 'related', 'seller_profile', 'wishlist', 'direct', 'other']
    },
    deviceType: {
      type: 'string',
      enum: ['desktop', 'mobile', 'tablet', 'other']
    },
    sessionId: {
      type: 'string',
      maxLength: 100
    },
    referrer: {
      type: 'string',
      maxLength: 500
    },
    viewDuration: {
      type: 'number',
      minimum: 0
    }
  }
};

const addViewedProductSchema = {
  description: 'Add a viewed product record (authenticated users)',
  tags: ['viewed-products'],
  body: {
    type: 'object',
    required: ['productId'],
    properties: {
      productId: {
        type: 'string',
        description: 'External ID of the product being viewed',
        minLength: 1,
        maxLength: 100
      },
      metadata: metadataSchema
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            viewId: { type: 'string' },
            viewedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

const addAnonymousViewedProductSchema = {
  description: 'Add a viewed product record (anonymous users)',
  tags: ['viewed-products'],
  body: {
    type: 'object',
    required: ['productId', 'anonymousId'],
    properties: {
      productId: {
        type: 'string',
        description: 'External ID of the product being viewed',
        minLength: 1,
        maxLength: 100
      },
      anonymousId: {
        type: 'string',
        description: 'Anonymous user identifier',
        minLength: 1,
        maxLength: 100
      },
      metadata: metadataSchema
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            viewId: { type: 'string' },
            viewedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

const bulkAddViewedProductsSchema = {
  description: 'Bulk add viewed products (for localStorage migration)',
  tags: ['viewed-products'],
  body: {
    type: 'object',
    required: ['products'],
    properties: {
      products: {
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: {
              type: 'string',
              minLength: 1,
              maxLength: 100
            },
            viewedAt: {
              type: 'string',
              format: 'date-time'
            },
            metadata: metadataSchema
          }
        }
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            successful: { type: 'number' },
            failed: { type: 'number' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  error: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }
};

const getViewedProductsSchema = {
  description: 'Get user\'s recently viewed products',
  tags: ['viewed-products'],
  querystring: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20
      },
      offset: {
        type: 'integer',
        minimum: 0,
        default: 0
      },
      includeProductDetails: {
        type: 'boolean',
        default: true
      },
      timeframe: {
        type: 'string',
        enum: ['7d', '30d', '90d', 'all'],
        default: '90d'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            views: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  viewId: { type: 'string' },
                  productId: { type: 'string' },
                  viewedAt: { type: 'string', format: 'date-time' },
                  metadata: metadataSchema,
                  product: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      price: { type: 'number' },
                      originalPrice: { type: 'number' },
                      categoryName: { type: 'string' },
                      platform: { type: 'string' },
                      region: { type: 'string' },
                      thumbnailUrl: { type: 'string' },
                      quantityOfActiveCodes: { type: 'number' },
                      status: { type: 'string' }
                    }
                  }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                limit: { type: 'number' },
                offset: { type: 'number' },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  }
};

const clearViewedProductsSchema = {
  description: 'Clear user\'s viewed products history',
  tags: ['viewed-products'],
  querystring: {
    type: 'object',
    properties: {
      olderThan: {
        type: 'string',
        format: 'date-time',
        description: 'Only clear views older than this date'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            deletedCount: { type: 'number' }
          }
        }
      }
    }
  }
};

const removeViewedProductSchema = {
  description: 'Remove a specific viewed product',
  tags: ['viewed-products'],
  params: {
    type: 'object',
    required: ['viewId'],
    properties: {
      viewId: {
        type: 'string',
        description: 'External ID of the view record to remove'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    404: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

const getViewingAnalyticsSchema = {
  description: 'Get viewing analytics (admin/support only)',
  tags: ['viewed-products', 'analytics'],
  querystring: {
    type: 'object',
    properties: {
      timeframe: {
        type: 'string',
        enum: ['7d', '30d', '90d'],
        default: '7d'
      },
      type: {
        type: 'string',
        enum: ['popular', 'trends'],
        default: 'popular'
      }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          additionalProperties: true
        }
      }
    },
    403: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

module.exports = {
  addViewedProductSchema,
  addAnonymousViewedProductSchema,
  bulkAddViewedProductsSchema,
  getViewedProductsSchema,
  clearViewedProductsSchema,
  removeViewedProductSchema,
  getViewingAnalyticsSchema
};