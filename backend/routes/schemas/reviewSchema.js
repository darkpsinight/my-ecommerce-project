const reviewSchema = {
  createReview: {
    description: "Create a new review for a completed order",
    tags: ["Reviews"],
    summary: "Create review",
    body: {
      type: "object",
      required: ["orderId", "rating"],
      properties: {
        orderId: {
          type: "string",
          description: "Order ID (external ID or MongoDB ObjectId)"
        },
        rating: {
          type: "integer",
          minimum: 1,
          maximum: 5,
          description: "Rating from 1 to 5 stars"
        },
        comment: {
          type: "string",
          maxLength: 1000,
          description: "Optional review comment (max 1000 characters)"
        }
      }
    },
    response: {
      200: {
        description: "Review created successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              reviewId: { type: "string" },
              rating: { type: "integer" },
              comment: { type: "string" },
              createdAt: { type: "string", format: "date-time" }
            }
          }
        }
      },
      400: {
        description: "Bad request - validation error or already reviewed",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" }
        }
      },
      404: {
        description: "Order not found",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" }
        }
      }
    }
  },

  getListingReviews: {
    description: "Get reviews for a specific listing",
    tags: ["Reviews"],
    summary: "Get listing reviews",
    params: {
      type: "object",
      required: ["listingId"],
      properties: {
        listingId: {
          type: "string",
          description: "Listing ID"
        }
      }
    },
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
          maximum: 50,
          default: 10,
          description: "Number of reviews per page"
        },
        sortBy: {
          type: "string",
          enum: ["createdAt", "rating", "helpfulVotes"],
          default: "createdAt",
          description: "Sort field"
        },
        sortOrder: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
          description: "Sort order"
        },
        minRating: {
          type: "integer",
          minimum: 1,
          maximum: 5,
          description: "Minimum rating filter"
        },
        maxRating: {
          type: "integer",
          minimum: 1,
          maximum: 5,
          description: "Maximum rating filter"
        }
      }
    },
    response: {
      200: {
        description: "Reviews retrieved successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              reviews: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    reviewerId: { type: "object" },
                    rating: { type: "integer" },
                    comment: { type: "string" },
                    helpfulVotes: { type: "integer" },
                    createdAt: { type: "string", format: "date-time" },
                    adminResponse: { type: "string" },
                    adminResponseDate: { type: "string", format: "date-time" }
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
              },
              statistics: {
                type: "object",
                properties: {
                  averageRating: { type: "number" },
                  totalReviews: { type: "integer" },
                  ratingDistribution: {
                    type: "object",
                    properties: {
                      "1": { type: "integer" },
                      "2": { type: "integer" },
                      "3": { type: "integer" },
                      "4": { type: "integer" },
                      "5": { type: "integer" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  getSellerReviews: {
    description: "Get reviews for the authenticated seller",
    tags: ["Reviews"],
    summary: "Get seller reviews",
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
          maximum: 50,
          default: 10,
          description: "Number of reviews per page"
        },
        sortBy: {
          type: "string",
          enum: ["createdAt", "rating"],
          default: "createdAt",
          description: "Sort field"
        },
        sortOrder: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
          description: "Sort order"
        }
      }
    },
    response: {
      200: {
        description: "Seller reviews retrieved successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              reviews: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    reviewerId: { type: "object" },
                    listingId: { type: "object" },
                    rating: { type: "integer" },
                    comment: { type: "string" },
                    helpfulVotes: { type: "integer" },
                    createdAt: { type: "string", format: "date-time" }
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
      }
    }
  },

  canUserReviewOrder: {
    description: "Check if user can review a specific order",
    tags: ["Reviews"],
    summary: "Check review eligibility",
    params: {
      type: "object",
      required: ["orderId"],
      properties: {
        orderId: {
          type: "string",
          description: "Order ID (external ID or MongoDB ObjectId)"
        }
      }
    },
    response: {
      200: {
        description: "Review eligibility checked successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              canReview: { type: "boolean" },
              reason: { type: "string" },
              existingReview: {
                type: "object",
                properties: {
                  rating: { type: "integer" },
                  comment: { type: "string" },
                  createdAt: { type: "string", format: "date-time" }
                }
              },
              order: {
                type: "object",
                properties: {
                  externalId: { type: "string" },
                  totalAmount: { type: "number" },
                  currency: { type: "string" },
                  createdAt: { type: "string", format: "date-time" },
                  orderItems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        platform: { type: "string" },
                        region: { type: "string" },
                        quantity: { type: "integer" },
                        totalPrice: { type: "number" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  markReviewAsHelpful: {
    description: "Mark a review as helpful",
    tags: ["Reviews"],
    summary: "Mark review helpful",
    params: {
      type: "object",
      required: ["reviewId"],
      properties: {
        reviewId: {
          type: "string",
          description: "Review ID"
        }
      }
    },
    response: {
      200: {
        description: "Review marked as helpful successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              helpfulVotes: { type: "integer" }
            }
          }
        }
      },
      400: {
        description: "Bad request - already marked or own review",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" }
        }
      },
      404: {
        description: "Review not found",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" }
        }
      }
    }
  },

  removeHelpfulMark: {
    description: "Remove helpful mark from a review",
    tags: ["Reviews"],
    summary: "Remove helpful mark",
    params: {
      type: "object",
      required: ["reviewId"],
      properties: {
        reviewId: {
          type: "string",
          description: "Review ID"
        }
      }
    },
    response: {
      200: {
        description: "Helpful mark removed successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" },
          data: {
            type: "object",
            properties: {
              helpfulVotes: { type: "integer" }
            }
          }
        }
      },
      400: {
        description: "Bad request - not marked as helpful",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" }
        }
      },
      404: {
        description: "Review not found",
        type: "object",
        properties: {
          success: { type: "boolean" },
          message: { type: "string" }
        }
      }
    }
  }
};

module.exports = {
  reviewSchema
};