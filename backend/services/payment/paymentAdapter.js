// Base Payment Adapter Interface
// This defines the contract that all payment adapters must implement

class PaymentAdapter {
  constructor(config = {}) {
    this.config = config;
  }

  // Account Management Methods
  async createStripeAccountForSeller(sellerId, country = "US") {
    throw new Error("createStripeAccountForSeller must be implemented by payment adapter");
  }

  async createAccountLink(accountId, refreshUrl, returnUrl) {
    throw new Error("createAccountLink must be implemented by payment adapter");
  }

  async getAccountStatus(accountId) {
    throw new Error("getAccountStatus must be implemented by payment adapter");
  }

  // Payment Processing Methods
  async createPaymentIntentOnPlatform(amountCents, currency, metadata = {}) {
    throw new Error("createPaymentIntentOnPlatform must be implemented by payment adapter");
  }

  async createTopUpIntent(buyerId, amountCents, currency = "USD", metadata = {}) {
    throw new Error("createTopUpIntent must be implemented by payment adapter");
  }

  async confirmPaymentIntent(paymentIntentId) {
    throw new Error("confirmPaymentIntent must be implemented by payment adapter");
  }

  // Transfer Methods
  async createTransferToSeller(escrowId, amountCents, sellerId, stripeAccountId, metadata = {}) {
    throw new Error("createTransferToSeller must be implemented by payment adapter");
  }

  // Refund Methods
  async refundPayment(paymentIntentId, amountCents = null, reason = "requested_by_customer") {
    throw new Error("refundPayment must be implemented by payment adapter");
  }

  // Webhook Processing
  async handleWebhookEvent(event, signature, endpointSecret) {
    throw new Error("handleWebhookEvent must be implemented by payment adapter");
  }

  async processWebhookEvent(webhookEvent) {
    throw new Error("processWebhookEvent must be implemented by payment adapter");
  }

  // Capabilities
  async getPayoutCapabilities(sellerId) {
    throw new Error("getPayoutCapabilities must be implemented by payment adapter");
  }

  // Utility Methods
  generateIdempotencyKey(prefix = "idem") {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}_${timestamp}_${random}`;
  }

  validateAmount(amountCents) {
    if (!Number.isInteger(amountCents) || amountCents < 50) {
      throw new Error("Amount must be an integer of at least 50 cents");
    }
    return true;
  }

  validateCurrency(currency) {
    const supportedCurrencies = ["USD", "EUR", "GBP"];
    if (!supportedCurrencies.includes(currency.toUpperCase())) {
      throw new Error(`Currency ${currency} is not supported`);
    }
    return currency.toUpperCase();
  }
}

module.exports = PaymentAdapter;