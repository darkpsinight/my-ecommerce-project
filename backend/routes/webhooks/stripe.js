const { WebhookEvent } = require("../../models/webhookEvent");
const StripeAdapter = require("../../services/payment/stripeAdapter");
const PaymentLogger = require("../../services/payment/paymentLogger");
const { 
  WebhookVerificationError, 
  PaymentErrorHandler 
} = require("../../services/payment/paymentErrors");
const { configs } = require("../../configs");
const { sendSuccessResponse, sendErrorResponse } = require("../../utils/responseHelpers");

// Initialize services
const stripeAdapter = new StripeAdapter();
const logger = new PaymentLogger();

/**
 * POST /api/v1/webhooks/stripe
 * Handle Stripe webhook events with signature verification
 */
const handleStripeWebhook = async (request, reply) => {
  const startTime = Date.now();
  
  try {
    // Get raw body and signature
    const rawBody = request.rawBody || request.body;
    const signature = request.headers['stripe-signature'];
    
    console.log("🔄 Stripe webhook received", {
      hasSignature: !!signature,
      bodyLength: rawBody ? rawBody.length : 0,
      ip: request.ip,
      userAgent: request.headers['user-agent']
    });
    
    if (!signature) {
      console.log("❌ Missing Stripe signature header");
      logger.logSecurityEvent("missing_webhook_signature", {
        ip: request.ip,
        userAgent: request.headers['user-agent']
      });
      
      return sendErrorResponse(reply, 400, "Missing Stripe signature header");
    }

    // Determine which webhook secret to use based on event source
    const webhookSecret = configs.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.log("❌ Webhook secret not configured");
      logger.logSecurityEvent("missing_webhook_secret", {
        configuredSecrets: {
          platform: !!configs.STRIPE_WEBHOOK_SECRET,
          connect: !!configs.STRIPE_CONNECT_WEBHOOK_SECRET
        }
      });
      
      return sendErrorResponse(reply, 500, "Webhook secret not configured");
    }

    console.log("🔍 Processing webhook with StripeAdapter");
    
    // Verify and process the webhook
    const result = await stripeAdapter.handleWebhookEvent(
      rawBody,
      signature,
      webhookSecret
    );

    const processingTime = Date.now() - startTime;
    
    console.log("✅ Stripe webhook processed successfully", {
      eventId: result.eventId,
      processingTime,
      received: result.received
    });
    
    logger.logWebhookReceived({
      id: result.eventId,
      type: "unknown", // Will be updated by the adapter
      created: Date.now()
    });

    // Log successful webhook processing
    request.log.info({
      msg: "Stripe webhook processed successfully",
      eventId: result.eventId,
      processingTime,
      ip: request.ip
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Webhook received and processed",
      data: {
        received: result.received,
        eventId: result.eventId,
        processingTime
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Handle different types of webhook errors
    if (error instanceof WebhookVerificationError) {
      logger.logSecurityEvent("webhook_verification_failed", {
        error: error.message,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        hasSignature: !!request.headers['stripe-signature']
      });
      
      request.log.warn({
        msg: "Webhook signature verification failed",
        error: error.message,
        ip: request.ip,
        processingTime
      });
      
      return sendErrorResponse(reply, 401, "Webhook signature verification failed");
    }

    // Log other webhook processing errors
    PaymentErrorHandler.logError(error, {
      context: "stripe_webhook",
      ip: request.ip,
      hasSignature: !!request.headers['stripe-signature'],
      processingTime
    });

    request.log.error({
      msg: "Webhook processing failed",
      error: error.message,
      stack: error.stack,
      ip: request.ip,
      processingTime
    });

    // Return 500 to trigger Stripe retry
    return sendErrorResponse(reply, 500, "Webhook processing failed");
  }
};

/**
 * POST /api/v1/webhooks/stripe/connect
 * Handle Stripe Connect webhook events
 */
const handleStripeConnectWebhook = async (request, reply) => {
  const startTime = Date.now();
  
  try {
    const rawBody = request.rawBody || request.body;
    const signature = request.headers['stripe-signature'];
    
    if (!signature) {
      logger.logSecurityEvent("missing_connect_webhook_signature", {
        ip: request.ip,
        userAgent: request.headers['user-agent']
      });
      
      return sendErrorResponse(reply, 400, "Missing Stripe signature header");
    }

    // Use Connect webhook secret
    const webhookSecret = configs.STRIPE_CONNECT_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return sendErrorResponse(reply, 500, "Connect webhook secret not configured");
    }

    // Process Connect webhook with different source
    const connectAdapter = new StripeAdapter({
      webhookSecret: webhookSecret
    });

    const result = await connectAdapter.handleWebhookEvent(
      rawBody,
      signature,
      webhookSecret
    );

    const processingTime = Date.now() - startTime;

    request.log.info({
      msg: "Stripe Connect webhook processed successfully",
      eventId: result.eventId,
      processingTime,
      ip: request.ip
    });

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Connect webhook received and processed",
      data: {
        received: result.received,
        eventId: result.eventId,
        processingTime,
        source: "connect"
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    PaymentErrorHandler.logError(error, {
      context: "stripe_connect_webhook",
      ip: request.ip,
      processingTime
    });

    request.log.error({
      msg: "Connect webhook processing failed",
      error: error.message,
      ip: request.ip,
      processingTime
    });

    return sendErrorResponse(reply, 500, "Connect webhook processing failed");
  }
};

/**
 * GET /api/v1/webhooks/stripe/events
 * Get webhook event history (admin only)
 */
const getWebhookEvents = async (request, reply) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      source,
      processed,
      startDate,
      endDate
    } = request.query;

    // Build query filters
    const filters = {};
    if (type) filters.type = type;
    if (source) filters.source = source;
    if (processed !== undefined) filters.processed = processed === 'true';
    
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    // Get events with pagination
    const skip = (page - 1) * limit;
    const events = await WebhookEvent.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-rawData') // Exclude raw data for performance
      .lean();

    const total = await WebhookEvent.countDocuments(filters);

    // Get processing statistics
    const stats = await WebhookEvent.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          processed: { $sum: { $cond: ['$processed', 1, 0] } },
          failed: { $sum: { $cond: [{ $gt: ['$processingAttempts', 0] }, 1, 0] } },
          avgProcessingAttempts: { $avg: '$processingAttempts' }
        }
      }
    ]);

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Webhook events retrieved successfully",
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        statistics: stats[0] || {
          total: 0,
          processed: 0,
          failed: 0,
          avgProcessingAttempts: 0
        }
      }
    });

  } catch (error) {
    PaymentErrorHandler.logError(error, {
      context: "get_webhook_events",
      userId: request.user?.uid
    });

    request.log.error({
      msg: "Failed to retrieve webhook events",
      error: error.message,
      userId: request.user?.uid
    });

    return sendErrorResponse(reply, 500, "Failed to retrieve webhook events");
  }
};

/**
 * POST /api/v1/webhooks/stripe/events/:eventId/retry
 * Retry processing a failed webhook event (admin only)
 */
const retryWebhookEvent = async (request, reply) => {
  try {
    const { eventId } = request.params;

    // Get the webhook event
    const webhookEvent = await WebhookEvent.findById(eventId);
    if (!webhookEvent) {
      return sendErrorResponse(reply, 404, "Webhook event not found");
    }

    // Check if event should be retried
    if (webhookEvent.processed) {
      return sendErrorResponse(reply, 400, "Event has already been processed successfully");
    }

    if (!webhookEvent.shouldRetryProcessing()) {
      return sendErrorResponse(reply, 400, "Event has exceeded maximum retry attempts or is too recent");
    }

    // Retry processing
    const adapter = new StripeAdapter();
    await adapter.processWebhookEvent(webhookEvent);

    logger.logWebhookProcessed(
      { id: webhookEvent.stripeEventId, type: webhookEvent.type },
      Date.now() - webhookEvent.lastProcessingAttempt?.getTime() || 0
    );

    return sendSuccessResponse(reply, {
      statusCode: 200,
      message: "Webhook event retry initiated",
      data: {
        eventId: webhookEvent._id,
        stripeEventId: webhookEvent.stripeEventId,
        processingAttempts: webhookEvent.processingAttempts + 1,
        retryInitiated: true
      }
    });

  } catch (error) {
    PaymentErrorHandler.logError(error, {
      context: "retry_webhook_event",
      eventId: request.params.eventId,
      userId: request.user?.uid
    });

    return sendErrorResponse(reply, 500, "Failed to retry webhook event");
  }
};

/**
 * GET /api/v1/webhooks/stripe/health
 * Webhook endpoint health check
 */
const webhookHealthCheck = async (request, reply) => {
  try {
    // Check recent webhook processing health
    const recentEvents = await WebhookEvent.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).limit(100);

    const failedEvents = recentEvents.filter(event => 
      !event.processed && event.processingAttempts > 0
    );

    const processingRate = recentEvents.length > 0 
      ? ((recentEvents.length - failedEvents.length) / recentEvents.length) * 100 
      : 100;

    const health = {
      status: processingRate >= 95 ? "healthy" : processingRate >= 80 ? "degraded" : "unhealthy",
      processingRate: Math.round(processingRate * 100) / 100,
      recentEvents: recentEvents.length,
      failedEvents: failedEvents.length,
      configuredSecrets: {
        platform: !!configs.STRIPE_WEBHOOK_SECRET,
        connect: !!configs.STRIPE_CONNECT_WEBHOOK_SECRET
      },
      timestamp: new Date().toISOString()
    };

    const statusCode = health.status === "healthy" ? 200 : 
                      health.status === "degraded" ? 200 : 503;

    return sendSuccessResponse(reply, {
      statusCode,
      message: `Webhook system is ${health.status}`,
      data: health
    });

  } catch (error) {
    return sendErrorResponse(reply, 500, "Health check failed");
  }
};

module.exports = {
  handleStripeWebhook,
  handleStripeConnectWebhook,
  getWebhookEvents,
  retryWebhookEvent,
  webhookHealthCheck
};