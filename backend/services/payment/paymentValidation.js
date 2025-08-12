// Payment validation utilities

const { PaymentError } = require("./paymentErrors");

class PaymentValidation {
  // Amount validation
  static validateAmount(amountCents, minAmount = 50, maxAmount = 100000000) {
    if (!Number.isInteger(amountCents)) {
      throw new PaymentError(
        "Amount must be an integer (in cents)",
        "INVALID_AMOUNT_FORMAT",
        400
      );
    }

    if (amountCents < minAmount) {
      throw new PaymentError(
        `Amount must be at least ${minAmount} cents`,
        "AMOUNT_TOO_SMALL",
        400
      );
    }

    if (amountCents > maxAmount) {
      throw new PaymentError(
        `Amount cannot exceed ${maxAmount} cents`,
        "AMOUNT_TOO_LARGE",
        400
      );
    }

    return true;
  }

  // Currency validation
  static validateCurrency(currency) {
    const supportedCurrencies = ["USD", "EUR", "GBP"];
    const normalizedCurrency = currency.toUpperCase();

    if (!supportedCurrencies.includes(normalizedCurrency)) {
      throw new PaymentError(
        `Currency ${currency} is not supported. Supported currencies: ${supportedCurrencies.join(", ")}`,
        "UNSUPPORTED_CURRENCY",
        400
      );
    }

    return normalizedCurrency;
  }

  // Country validation for Stripe Connect
  static validateCountry(country) {
    const supportedCountries = ["US", "CA", "GB", "AU", "FR", "DE", "IT", "ES", "NL"];
    const normalizedCountry = country.toUpperCase();

    if (!supportedCountries.includes(normalizedCountry)) {
      throw new PaymentError(
        `Country ${country} is not supported for Stripe Connect`,
        "UNSUPPORTED_COUNTRY",
        400
      );
    }

    return normalizedCountry;
  }

  // Metadata validation
  static validateMetadata(metadata) {
    if (!metadata || typeof metadata !== "object") {
      return {};
    }

    // Stripe metadata has limitations
    const validatedMetadata = {};
    const maxKeys = 50;
    const maxKeyLength = 40;
    const maxValueLength = 500;

    const keys = Object.keys(metadata);
    if (keys.length > maxKeys) {
      throw new PaymentError(
        `Metadata cannot have more than ${maxKeys} keys`,
        "METADATA_TOO_MANY_KEYS",
        400
      );
    }

    for (const [key, value] of Object.entries(metadata)) {
      if (key.length > maxKeyLength) {
        throw new PaymentError(
          `Metadata key "${key}" is too long (max ${maxKeyLength} characters)`,
          "METADATA_KEY_TOO_LONG",
          400
        );
      }

      const stringValue = String(value);
      if (stringValue.length > maxValueLength) {
        throw new PaymentError(
          `Metadata value for key "${key}" is too long (max ${maxValueLength} characters)`,
          "METADATA_VALUE_TOO_LONG",
          400
        );
      }

      validatedMetadata[key] = stringValue;
    }

    return validatedMetadata;
  }

  // User ID validation
  static validateUserId(userId) {
    if (!userId) {
      throw new PaymentError(
        "User ID is required",
        "MISSING_USER_ID",
        400
      );
    }

    // Check if it's a valid MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(userId.toString())) {
      throw new PaymentError(
        "Invalid user ID format",
        "INVALID_USER_ID",
        400
      );
    }

    return userId.toString();
  }

  // Stripe account ID validation
  static validateStripeAccountId(accountId) {
    if (!accountId) {
      throw new PaymentError(
        "Stripe account ID is required",
        "MISSING_STRIPE_ACCOUNT_ID",
        400
      );
    }

    // Stripe account IDs start with "acct_"
    if (!accountId.startsWith("acct_")) {
      throw new PaymentError(
        "Invalid Stripe account ID format",
        "INVALID_STRIPE_ACCOUNT_ID",
        400
      );
    }

    return accountId;
  }

  // Payment Intent ID validation
  static validatePaymentIntentId(paymentIntentId) {
    if (!paymentIntentId) {
      throw new PaymentError(
        "Payment Intent ID is required",
        "MISSING_PAYMENT_INTENT_ID",
        400
      );
    }

    // Stripe Payment Intent IDs start with "pi_"
    if (!paymentIntentId.startsWith("pi_")) {
      throw new PaymentError(
        "Invalid Payment Intent ID format",
        "INVALID_PAYMENT_INTENT_ID",
        400
      );
    }

    return paymentIntentId;
  }

  // Transfer ID validation
  static validateTransferId(transferId) {
    if (!transferId) {
      throw new PaymentError(
        "Transfer ID is required",
        "MISSING_TRANSFER_ID",
        400
      );
    }

    // Stripe Transfer IDs start with "tr_"
    if (!transferId.startsWith("tr_")) {
      throw new PaymentError(
        "Invalid Transfer ID format",
        "INVALID_TRANSFER_ID",
        400
      );
    }

    return transferId;
  }

  // URL validation for account links
  static validateUrl(url, fieldName = "URL") {
    if (!url) {
      throw new PaymentError(
        `${fieldName} is required`,
        "MISSING_URL",
        400
      );
    }

    try {
      const urlObj = new URL(url);
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        throw new Error("Invalid protocol");
      }
      return url;
    } catch (error) {
      throw new PaymentError(
        `Invalid ${fieldName} format`,
        "INVALID_URL",
        400
      );
    }
  }

  // Webhook signature validation
  static validateWebhookSignature(signature) {
    if (!signature) {
      throw new PaymentError(
        "Webhook signature is required",
        "MISSING_WEBHOOK_SIGNATURE",
        400
      );
    }

    // Stripe webhook signatures have a specific format
    if (!signature.includes("t=") || !signature.includes("v1=")) {
      throw new PaymentError(
        "Invalid webhook signature format",
        "INVALID_WEBHOOK_SIGNATURE",
        400
      );
    }

    return signature;
  }

  // Comprehensive payment request validation
  static validatePaymentRequest(request) {
    const errors = [];

    try {
      this.validateAmount(request.amountCents);
    } catch (error) {
      errors.push(error.message);
    }

    try {
      this.validateCurrency(request.currency);
    } catch (error) {
      errors.push(error.message);
    }

    if (request.userId) {
      try {
        this.validateUserId(request.userId);
      } catch (error) {
        errors.push(error.message);
      }
    }

    if (request.metadata) {
      try {
        this.validateMetadata(request.metadata);
      } catch (error) {
        errors.push(error.message);
      }
    }

    if (errors.length > 0) {
      throw new PaymentError(
        `Validation failed: ${errors.join(", ")}`,
        "VALIDATION_FAILED",
        400,
        { errors }
      );
    }

    return true;
  }

  // Transfer request validation
  static validateTransferRequest(request) {
    const errors = [];

    try {
      this.validateAmount(request.amountCents);
    } catch (error) {
      errors.push(error.message);
    }

    try {
      this.validateUserId(request.sellerId);
    } catch (error) {
      errors.push(`Seller ID: ${error.message}`);
    }

    try {
      this.validateStripeAccountId(request.stripeAccountId);
    } catch (error) {
      errors.push(error.message);
    }

    if (request.currency) {
      try {
        this.validateCurrency(request.currency);
      } catch (error) {
        errors.push(error.message);
      }
    }

    if (errors.length > 0) {
      throw new PaymentError(
        `Transfer validation failed: ${errors.join(", ")}`,
        "TRANSFER_VALIDATION_FAILED",
        400,
        { errors }
      );
    }

    return true;
  }
}

module.exports = PaymentValidation;