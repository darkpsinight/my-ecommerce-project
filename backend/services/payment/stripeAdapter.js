const PaymentAdapter = require("./paymentAdapter");
const { 
  PaymentError, 
  StripeError, 
  InsufficientFundsError, 
  AccountNotVerifiedError,
  WebhookVerificationError,
  PaymentErrorHandler 
} = require("./paymentErrors");
const PaymentValidation = require("./paymentValidation");
const PaymentLogger = require("./paymentLogger");
const { PaymentOperation } = require("../../models/paymentOperation");
const { StripeAccount } = require("../../models/stripeAccount");
const { WebhookEvent } = require("../../models/webhookEvent");
const { configs } = require("../../configs");

class StripeAdapter extends PaymentAdapter {
  constructor(config = {}) {
    super(config);
    
    // Initialize Stripe lazily to avoid environment variable issues
    this.stripe = null;
    this.logger = new PaymentLogger();
    this.config = {
      secretKey: config.secretKey || configs.STRIPE_SECRET_KEY,
      apiVersion: config.apiVersion || configs.STRIPE_API_VERSION,
      webhookSecret: config.webhookSecret || configs.STRIPE_WEBHOOK_SECRET,
      connectWebhookSecret: config.connectWebhookSecret || configs.STRIPE_CONNECT_WEBHOOK_SECRET,
      connectMode: config.connectMode || configs.STRIPE_CONNECT_MODE,
      ...config
    };
  }

  getStripe() {
    if (!this.stripe) {
      if (!this.config.secretKey) {
        throw new PaymentError(
          "Stripe secret key is not configured",
          "STRIPE_NOT_CONFIGURED",
          500
        );
      }
      
      this.stripe = require("stripe")(this.config.secretKey, {
        apiVersion: this.config.apiVersion
      });
    }
    return this.stripe;
  }

  // Account Management Methods
  async createStripeAccountForSeller(sellerId, country = "US") {
    try {
      // Validate inputs
      PaymentValidation.validateUserId(sellerId);
      PaymentValidation.validateCountry(country);
      
      const stripe = this.getStripe();
      const idempotencyKey = this.generateIdempotencyKey("acct");

      // Check if account already exists
      const existingAccount = await StripeAccount.getBySellerId(sellerId);
      if (existingAccount) {
        this.logger.logOperationSuccess(
          { type: "account_lookup", id: sellerId },
          { existing: true, stripeAccountId: existingAccount.stripeAccountId }
        );
        return {
          stripeAccountId: existingAccount.stripeAccountId,
          status: existingAccount.status,
          existing: true
        };
      }

      // Create Stripe Connect account
      const account = await PaymentErrorHandler.withRetry(async () => {
        return await stripe.accounts.create({
          type: "custom",
          country: country,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true }
          },
          business_type: "individual", // Can be made configurable
          metadata: {
            sellerId: sellerId.toString(),
            createdBy: "stripe-connect-migration"
          }
        }, {
          idempotencyKey
        });
      });

      // Save to database
      const stripeAccount = await StripeAccount.createForSeller(
        sellerId,
        account.id,
        country
      );

      await stripeAccount.updateFromStripeAccount(account);

      return {
        stripeAccountId: account.id,
        status: stripeAccount.status,
        existing: false
      };

    } catch (error) {
      PaymentErrorHandler.logError(error, { 
        method: "createStripeAccountForSeller", 
        sellerId, 
        country 
      });
      throw PaymentErrorHandler.handleStripeError(error);
    }
  }

  async createAccountLink(accountId, refreshUrl, returnUrl) {
    try {
      const stripe = this.getStripe();

      // Verify account exists in our database
      const stripeAccount = await StripeAccount.getByStripeAccountId(accountId);
      if (!stripeAccount) {
        throw new PaymentError(
          `Stripe account ${accountId} not found in database`,
          "ACCOUNT_NOT_FOUND",
          404
        );
      }

      const accountLink = await PaymentErrorHandler.withRetry(async () => {
        return await stripe.accountLinks.create({
          account: accountId,
          refresh_url: refreshUrl,
          return_url: returnUrl,
          type: "account_onboarding"
        });
      });

      return {
        url: accountLink.url,
        expiresAt: accountLink.expires_at
      };

    } catch (error) {
      PaymentErrorHandler.logError(error, { 
        method: "createAccountLink", 
        accountId, 
        refreshUrl, 
        returnUrl 
      });
      throw PaymentErrorHandler.handleStripeError(error);
    }
  }

  async getAccountStatus(accountId) {
    try {
      const stripe = this.getStripe();

      const account = await PaymentErrorHandler.withRetry(async () => {
        return await stripe.accounts.retrieve(accountId);
      });

      // Update our database record
      const stripeAccount = await StripeAccount.getByStripeAccountId(accountId);
      if (stripeAccount) {
        await stripeAccount.updateFromStripeAccount(account);
      }

      return {
        id: account.id,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements,
        capabilities: account.capabilities
      };

    } catch (error) {
      PaymentErrorHandler.logError(error, { 
        method: "getAccountStatus", 
        accountId 
      });
      throw PaymentErrorHandler.handleStripeError(error);
    }
  }

  // Payment Processing Methods
  async createPaymentIntentOnPlatform(amountCents, currency, metadata = {}) {
    try {
      // Validate inputs
      PaymentValidation.validateAmount(amountCents);
      currency = PaymentValidation.validateCurrency(currency);
      metadata = PaymentValidation.validateMetadata(metadata);
      
      const stripe = this.getStripe();
      const idempotencyKey = this.generateIdempotencyKey("pi");

      const paymentIntent = await PaymentErrorHandler.withRetry(async () => {
        return await stripe.paymentIntents.create({
          amount: amountCents,
          currency: currency.toLowerCase(),
          metadata: {
            ...metadata,
            createdBy: "stripe-connect-migration",
            type: "platform_charge"
          },
          automatic_payment_methods: {
            enabled: true
          }
        }, {
          idempotencyKey
        });
      });

      // Record the operation
      await PaymentOperation.createCharge({
        stripeId: paymentIntent.id,
        amountCents,
        currency,
        userId: metadata.userId,
        escrowId: metadata.escrowId,
        description: `Platform charge of ${amountCents/100} ${currency}`,
        metadata
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amountCents,
        currency
      };

    } catch (error) {
      PaymentErrorHandler.logError(error, { 
        method: "createPaymentIntentOnPlatform", 
        amountCents, 
        currency, 
        metadata 
      });
      throw PaymentErrorHandler.handleStripeError(error);
    }
  }

  async createTopUpIntent(buyerId, amountCents, currency = "USD", metadata = {}) {
    try {
      this.validateAmount(amountCents);
      currency = this.validateCurrency(currency);

      const topUpMetadata = {
        ...metadata,
        buyerId: buyerId.toString(),
        type: "wallet_topup"
      };

      return await this.createPaymentIntentOnPlatform(
        amountCents,
        currency,
        topUpMetadata
      );

    } catch (error) {
      PaymentErrorHandler.logError(error, { 
        method: "createTopUpIntent", 
        buyerId, 
        amountCents, 
        currency, 
        metadata 
      });
      throw error;
    }
  }

  async confirmPaymentIntent(paymentIntentId) {
    try {
      const stripe = this.getStripe();

      const paymentIntent = await PaymentErrorHandler.withRetry(async () => {
        return await stripe.paymentIntents.retrieve(paymentIntentId);
      });

      // Update our operation record
      const operation = await PaymentOperation.getByStripeId(paymentIntentId);
      if (operation && paymentIntent.status === "succeeded") {
        await operation.markAsSucceeded(paymentIntent);
      }

      return {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        amountCents: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase()
      };

    } catch (error) {
      PaymentErrorHandler.logError(error, { 
        method: "confirmPaymentIntent", 
        paymentIntentId 
      });
      throw PaymentErrorHandler.handleStripeError(error);
    }
  }

  // Transfer Methods
  async createTransferToSeller(escrowId, amountCents, sellerId, stripeAccountId, metadata = {}) {
    try {
      this.validateAmount(amountCents);
      
      const stripe = this.getStripe();
      const idempotencyKey = this.generateIdempotencyKey("tr");

      // Verify seller account is ready for transfers
      const stripeAccount = await StripeAccount.getByStripeAccountId(stripeAccountId);
      if (!stripeAccount || !stripeAccount.isFullyVerified()) {
        throw new AccountNotVerifiedError(stripeAccountId, stripeAccount?.currentlyDue || []);
      }

      // Calculate platform fee (configurable, default 5%)
      const platformFeeRate = metadata.platformFeeRate || 0.05;
      const platformFeeCents = Math.round(amountCents * platformFeeRate);
      const transferAmountCents = amountCents - platformFeeCents;

      const transfer = await PaymentErrorHandler.withRetry(async () => {
        return await stripe.transfers.create({
          amount: transferAmountCents,
          currency: metadata.currency || "usd",
          destination: stripeAccountId,
          metadata: {
            ...metadata,
            escrowId: escrowId.toString(),
            sellerId: sellerId.toString(),
            platformFeeCents: platformFeeCents.toString(),
            createdBy: "stripe-connect-migration"
          }
        }, {
          idempotencyKey
        });
      });

      // Record the operation
      await PaymentOperation.createTransfer({
        stripeId: transfer.id,
        amountCents: transferAmountCents,
        currency: transfer.currency.toUpperCase(),
        sellerId,
        stripeAccountId,
        escrowId,
        platformFeeCents,
        description: `Transfer to seller ${sellerId} for escrow ${escrowId}`,
        metadata
      });

      return {
        transferId: transfer.id,
        amountCents: transferAmountCents,
        platformFeeCents,
        currency: transfer.currency.toUpperCase(),
        status: "pending"
      };

    } catch (error) {
      PaymentErrorHandler.logError(error, { 
        method: "createTransferToSeller", 
        escrowId, 
        amountCents, 
        sellerId, 
        stripeAccountId, 
        metadata 
      });
      throw PaymentErrorHandler.handleStripeError(error);
    }
  }

  // Refund Methods
  async refundPayment(paymentIntentId, amountCents = null, reason = "requested_by_customer") {
    try {
      const stripe = this.getStripe();
      const idempotencyKey = this.generateIdempotencyKey("re");

      // Get the original payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== "succeeded") {
        throw new PaymentError(
          `Cannot refund payment intent ${paymentIntentId} with status ${paymentIntent.status}`,
          "INVALID_REFUND_STATUS",
          400
        );
      }

      const refundAmount = amountCents || paymentIntent.amount;
      this.validateAmount(refundAmount);

      if (refundAmount > paymentIntent.amount) {
        throw new PaymentError(
          `Refund amount ${refundAmount} cannot exceed original amount ${paymentIntent.amount}`,
          "INVALID_REFUND_AMOUNT",
          400
        );
      }

      const refund = await PaymentErrorHandler.withRetry(async () => {
        return await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: refundAmount,
          reason,
          metadata: {
            createdBy: "stripe-connect-migration",
            originalAmount: paymentIntent.amount.toString()
          }
        }, {
          idempotencyKey
        });
      });

      // Record the operation
      await PaymentOperation.createRefund({
        stripeId: refund.id,
        amountCents: refundAmount,
        currency: refund.currency.toUpperCase(),
        userId: paymentIntent.metadata?.userId,
        paymentIntentId,
        description: `Refund of ${refundAmount/100} ${refund.currency.toUpperCase()} for payment ${paymentIntentId}`,
        metadata: { reason, originalAmount: paymentIntent.amount }
      });

      return {
        refundId: refund.id,
        amountCents: refundAmount,
        currency: refund.currency.toUpperCase(),
        status: refund.status,
        reason
      };

    } catch (error) {
      PaymentErrorHandler.logError(error, { 
        method: "refundPayment", 
        paymentIntentId, 
        amountCents, 
        reason 
      });
      throw PaymentErrorHandler.handleStripeError(error);
    }
  }

  // Webhook Processing
  async handleWebhookEvent(rawBody, signature, endpointSecret) {
    try {
      const stripe = this.getStripe();
      
      if (!endpointSecret) {
        throw new WebhookVerificationError("Webhook endpoint secret not configured");
      }

      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(rawBody, signature, endpointSecret);
      
      // Store the raw event
      const webhookEvent = await WebhookEvent.createFromStripeEvent(event, "platform");
      
      // Process the event asynchronously
      setImmediate(() => this.processWebhookEvent(webhookEvent));
      
      return { received: true, eventId: event.id };

    } catch (error) {
      if (error.type === "StripeSignatureVerificationError") {
        throw new WebhookVerificationError(error.message);
      }
      
      PaymentErrorHandler.logError(error, { 
        method: "handleWebhookEvent",
        hasSignature: !!signature,
        hasSecret: !!endpointSecret
      });
      throw PaymentErrorHandler.handleStripeError(error);
    }
  }

  async processWebhookEvent(webhookEvent) {
    try {
      const event = webhookEvent.rawData;
      
      switch (event.type) {
        case "payment_intent.succeeded":
          await this.handlePaymentIntentSucceeded(event);
          break;
          
        case "payment_intent.payment_failed":
          await this.handlePaymentIntentFailed(event);
          break;
          
        case "transfer.created":
          await this.handleTransferCreated(event);
          break;
          
        case "transfer.updated":
          await this.handleTransferUpdated(event);
          break;
          
        case "account.updated":
          await this.handleAccountUpdated(event);
          break;
          
        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
      
      await webhookEvent.markAsProcessed();
      
    } catch (error) {
      await webhookEvent.recordProcessingError(error);
      PaymentErrorHandler.logError(error, { 
        method: "processWebhookEvent", 
        eventType: webhookEvent.type,
        eventId: webhookEvent.stripeEventId
      });
    }
  }

  // Webhook Event Handlers
  async handlePaymentIntentSucceeded(event) {
    const paymentIntent = event.data.object;
    const operation = await PaymentOperation.getByStripeId(paymentIntent.id);
    
    if (operation) {
      await operation.markAsSucceeded(paymentIntent);
    }
  }

  async handlePaymentIntentFailed(event) {
    const paymentIntent = event.data.object;
    const operation = await PaymentOperation.getByStripeId(paymentIntent.id);
    
    if (operation) {
      const error = paymentIntent.last_payment_error;
      await operation.markAsFailed(
        error?.code || "payment_failed",
        error?.message || "Payment failed"
      );
    }
  }

  async handleTransferCreated(event) {
    const transfer = event.data.object;
    const operation = await PaymentOperation.getByStripeId(transfer.id);
    
    if (operation) {
      await operation.markAsSucceeded(transfer);
    }
  }

  async handleTransferUpdated(event) {
    const transfer = event.data.object;
    const operation = await PaymentOperation.getByStripeId(transfer.id);
    
    if (operation) {
      if (transfer.status === "paid") {
        await operation.markAsSucceeded(transfer);
      } else if (transfer.status === "failed") {
        await operation.markAsFailed("transfer_failed", "Transfer failed");
      }
    }
  }

  async handleAccountUpdated(event) {
    const account = event.data.object;
    const stripeAccount = await StripeAccount.getByStripeAccountId(account.id);
    
    if (stripeAccount) {
      await stripeAccount.updateFromStripeAccount(account);
    }
  }
}

module.exports = StripeAdapter;