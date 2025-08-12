// Payment-specific logging utilities with structured logging

class PaymentLogger {
  constructor(logger = console) {
    this.logger = logger;
  }

  // Log payment operation start
  logOperationStart(operation, context = {}) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: "info",
      event: "payment_operation_start",
      operation: {
        type: operation.type,
        id: operation.id || operation.externalId,
        amount: operation.amountCents,
        currency: operation.currency
      },
      context,
      correlationId: this.generateCorrelationId()
    };

    this.logger.info("Payment operation started", logData);
    return logData.correlationId;
  }

  // Log payment operation success
  logOperationSuccess(operation, result = {}, correlationId = null) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: "info",
      event: "payment_operation_success",
      operation: {
        type: operation.type,
        id: operation.id || operation.externalId,
        amount: operation.amountCents,
        currency: operation.currency
      },
      result,
      correlationId,
      duration: this.calculateDuration(correlationId)
    };

    this.logger.info("Payment operation succeeded", logData);
  }

  // Log payment operation failure
  logOperationFailure(operation, error, correlationId = null) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: "error",
      event: "payment_operation_failure",
      operation: {
        type: operation.type,
        id: operation.id || operation.externalId,
        amount: operation.amountCents,
        currency: operation.currency
      },
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack
      },
      correlationId,
      duration: this.calculateDuration(correlationId)
    };

    this.logger.error("Payment operation failed", logData);
  }

  // Log webhook processing
  logWebhookReceived(event, source = "platform") {
    const logData = {
      timestamp: new Date().toISOString(),
      level: "info",
      event: "webhook_received",
      webhook: {
        id: event.id,
        type: event.type,
        source,
        created: event.created
      }
    };

    this.logger.info("Webhook event received", logData);
  }

  logWebhookProcessed(event, processingTime) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: "info",
      event: "webhook_processed",
      webhook: {
        id: event.id,
        type: event.type
      },
      processingTime
    };

    this.logger.info("Webhook event processed", logData);
  }

  logWebhookFailed(event, error, attempt = 1) {
    const logData = {
      timestamp: new Date().toISOString(),
      level: "error",
      event: "webhook_processing_failed",
      webhook: {
        id: event.id,
        type: event.type
      },
      error: {
        name: error.name,
        message: error.message,
        code: error.code
      },
      attempt
    };

    this.logger.error("Webhook processing failed", logData);
  }

  // Utility methods
  generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  calculateDuration(correlationId) {
    if (!correlationId || !correlationId.startsWith("corr_")) {
      return null;
    }

    try {
      const timestamp = parseInt(correlationId.split("_")[1]);
      return Date.now() - timestamp;
    } catch (error) {
      return null;
    }
  }
}

module.exports = PaymentLogger;