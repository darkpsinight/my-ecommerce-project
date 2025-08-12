// Payment-specific error classes and error handling utilities

class PaymentError extends Error {
  constructor(message, code = "PAYMENT_ERROR", statusCode = 400, details = {}) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

class StripeError extends PaymentError {
  constructor(stripeError) {
    const message = stripeError.message || "Stripe error occurred";
    const code = stripeError.code || "STRIPE_ERROR";
    const statusCode = stripeError.statusCode || 400;
    
    super(message, code, statusCode, {
      type: stripeError.type,
      param: stripeError.param,
      stripeCode: stripeError.code,
      declineCode: stripeError.decline_code,
      requestId: stripeError.requestId
    });
    
    this.name = "StripeError";
    this.originalError = stripeError;
  }
}

class InsufficientFundsError extends PaymentError {
  constructor(availableAmount, requestedAmount, currency = "USD") {
    super(
      `Insufficient funds. Available: ${availableAmount/100} ${currency}, Requested: ${requestedAmount/100} ${currency}`,
      "INSUFFICIENT_FUNDS",
      400,
      { availableAmount, requestedAmount, currency }
    );
    this.name = "InsufficientFundsError";
  }
}

class AccountNotVerifiedError extends PaymentError {
  constructor(accountId, requirements = []) {
    super(
      `Stripe account ${accountId} is not fully verified`,
      "ACCOUNT_NOT_VERIFIED",
      400,
      { accountId, requirements }
    );
    this.name = "AccountNotVerifiedError";
  }
}

class WebhookVerificationError extends PaymentError {
  constructor(message = "Webhook signature verification failed") {
    super(message, "WEBHOOK_VERIFICATION_FAILED", 401);
    this.name = "WebhookVerificationError";
  }
}

class IdempotencyError extends PaymentError {
  constructor(key, existingOperation) {
    super(
      `Operation with idempotency key ${key} already exists`,
      "IDEMPOTENCY_CONFLICT",
      409,
      { idempotencyKey: key, existingOperation }
    );
    this.name = "IdempotencyError";
  }
}

// Error handling utilities
class PaymentErrorHandler {
  static handleStripeError(error) {
    // Convert Stripe errors to our custom error format
    if (error.type === "StripeCardError") {
      return new StripeError(error);
    }
    
    if (error.type === "StripeInvalidRequestError") {
      return new StripeError(error);
    }
    
    if (error.type === "StripeAPIError") {
      return new StripeError(error);
    }
    
    if (error.type === "StripeConnectionError") {
      return new PaymentError(
        "Unable to connect to payment processor",
        "CONNECTION_ERROR",
        503,
        { originalError: error.message }
      );
    }
    
    if (error.type === "StripeAuthenticationError") {
      return new PaymentError(
        "Payment processor authentication failed",
        "AUTHENTICATION_ERROR",
        401,
        { originalError: error.message }
      );
    }
    
    // Default Stripe error handling
    return new StripeError(error);
  }

  static async withRetry(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry certain types of errors
        if (this.shouldNotRetry(error)) {
          throw error;
        }
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        await this.sleep(delay);
      }
    }
    
    throw new PaymentError(
      `Operation failed after ${maxRetries} attempts: ${lastError.message}`,
      "MAX_RETRIES_EXCEEDED",
      500,
      { originalError: lastError, attempts: maxRetries }
    );
  }

  static shouldNotRetry(error) {
    // Don't retry these error types
    const nonRetryableErrors = [
      "INSUFFICIENT_FUNDS",
      "ACCOUNT_NOT_VERIFIED",
      "WEBHOOK_VERIFICATION_FAILED",
      "IDEMPOTENCY_CONFLICT"
    ];
    
    if (error.code && nonRetryableErrors.includes(error.code)) {
      return true;
    }
    
    // Don't retry 4xx errors (client errors)
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      return true;
    }
    
    return false;
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.toJSON ? error.toJSON() : {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    };
    
    console.error("Payment Error:", JSON.stringify(errorLog, null, 2));
    
    // In production, you might want to send this to a logging service
    // like Winston, Sentry, or CloudWatch
  }
}

module.exports = {
  PaymentError,
  StripeError,
  InsufficientFundsError,
  AccountNotVerifiedError,
  WebhookVerificationError,
  IdempotencyError,
  PaymentErrorHandler
};