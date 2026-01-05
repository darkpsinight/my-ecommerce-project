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
const { Order } = require("../../models/order");
const { LedgerEntry } = require("../../models/ledgerEntry");
const ledgerService = require("./ledgerService");
const { configs } = require("../../configs");

console.log("🔥 STRIPE ADAPTER FILE LOADED:", __filename);
class StripeAdapter extends PaymentAdapter {
  constructor(config = {}) {
    console.log("🔥 STRIPE ADAPTER INSTANCE CREATED FROM:", __filename);
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
  async createStripeAccountForSeller(sellerId, country = "US", businessType = "individual") {
    try {
      // Validate inputs
      PaymentValidation.validateUserId(sellerId);
      PaymentValidation.validateCountry(country);

      const validBusinessTypes = ["individual", "company"];
      if (!validBusinessTypes.includes(businessType)) {
        throw new PaymentError(
          `Invalid business type: ${businessType}. Must be one of: ${validBusinessTypes.join(", ")}`,
          "INVALID_BUSINESS_TYPE",
          400
        );
      }

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
        try {
          return await stripe.accounts.create({
            type: configs.STRIPE_ACCOUNT_TYPE,
            country: country,
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true }
            },
            business_type: businessType, // Dynamic business type
            metadata: {
              sellerId: sellerId.toString(),
              createdBy: "stripe-connect-migration"
            }
          }, {
            idempotencyKey
          });
        } catch (error) {
          if (error.code === 'country_unsupported') {
            throw new PaymentError(
              `Stripe ${configs.STRIPE_ACCOUNT_TYPE} accounts are not supported in ${country}`,
              "COUNTRY_UNSUPPORTED",
              400
            );
          }
          throw error;
        }
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

  // Helper: Calculate the gross amount to charge the buyer so the seller gets the target amount
  calculateGrossAmount(targetAmountCents) {
    // Stripe US pricing: 2.9% + 30¢
    // Gross = (Target + FixedFee) / (1 - PercentageFee)
    // PercentageFee = 0.029
    // FixedFee = 30 cents

    // TODO: these should be configurable/fetched from Stripe if possible, but hardcoded for now based on US standard
    const PERCENTAGE_FEE = 0.029;
    const FIXED_FEE_CENTS = 30;

    const grossAmount = Math.ceil((targetAmountCents + FIXED_FEE_CENTS) / (1 - PERCENTAGE_FEE));
    const stripeFee = grossAmount - targetAmountCents;

    return {
      grossAmountCents: grossAmount,
      stripeFeeCents: stripeFee,
      netAmountCents: targetAmountCents
    };
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

      // Check if we need to gross up the amount (Buyer Pays Fees)
      // Check metadata or config. Defaulting to true for this flow if not specified
      const buyerPaysFees = metadata.buyerPaysFees !== 'false';

      let finalAmountCents = amountCents;
      let stripeFeeCents = 0;
      let platformFeeCents = 0;
      let originalAmountCents = amountCents;

      if (buyerPaysFees) {
        const calculation = this.calculateGrossAmount(amountCents);
        finalAmountCents = calculation.grossAmountCents;
        stripeFeeCents = calculation.stripeFeeCents;
        // platformFee remains 0
      }

      const paymentIntent = await PaymentErrorHandler.withRetry(async () => {
        return await stripe.paymentIntents.create({
          amount: finalAmountCents,
          currency: currency.toLowerCase(),
          metadata: {
            ...metadata,
            createdBy: "stripe-connect-migration",
            type: "platform_charge",
            originalAmount: originalAmountCents.toString(),
            stripeFeeEst: stripeFeeCents.toString(),
            buyerPaysFees: buyerPaysFees.toString()
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
        amountCents: finalAmountCents,
        currency,
        userId: metadata.userId,
        escrowId: metadata.escrowId,
        description: `Platform charge of ${finalAmountCents / 100} ${currency} (Item: ${originalAmountCents / 100}, Fee: ${stripeFeeCents / 100})`,
        metadata: {
          ...metadata,
          feeStructure: {
            itemAmount: originalAmountCents,
            stripeFee: stripeFeeCents,
            totalCharged: finalAmountCents
          }
        }
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status,
        amountCents: finalAmountCents,
        originalAmountCents,
        stripeFeeCents,
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
        type: "wallet_topup",
        buyerPaysFees: 'true' // Explicitly enable for topups too if desired
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

  async createDirectPaymentIntent(amountCents, currency, sellerStripeAccountId, metadata = {}) {
    try {
      // Validate inputs
      PaymentValidation.validateAmount(amountCents);
      currency = PaymentValidation.validateCurrency(currency);

      if (!sellerStripeAccountId) {
        throw new PaymentError("Seller Stripe Account ID is required", "MISSING_SELLER_ACCOUNT", 400);
      }

      const stripe = this.getStripe();
      const idempotencyKey = this.generateIdempotencyKey("pi_direct");

      // 0% Platform Fee - Buyer pays exact item price, Seller receives exact item price (minus Stripe fees)
      // Funds go to the Connected Account via transfer_data
      // on_behalf_of makes the Connected Account the business of record

      const paymentIntent = await PaymentErrorHandler.withRetry(async () => {
        return await stripe.paymentIntents.create({
          amount: amountCents,
          currency: currency.toLowerCase(),
          automatic_payment_methods: {
            enabled: true
          },
          on_behalf_of: sellerStripeAccountId,
          transfer_data: {
            destination: sellerStripeAccountId
          },
          application_fee_amount: 0, // Explicitly 0% fee
          metadata: {
            ...metadata,
            createdBy: "codeSale",
            type: "direct_charge",
            sellerStripeAccountId
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
        userId: metadata.buyerId,
        sellerId: metadata.sellerId,
        description: `Direct charge for seller ${sellerStripeAccountId}`,
        metadata: {
          ...metadata,
          sellerStripeAccountId
        },
        stripeAccountId: sellerStripeAccountId
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
        method: "createDirectPaymentIntent",
        amountCents,
        currency,
        sellerStripeAccountId
      });
      throw PaymentErrorHandler.handleStripeError(error);
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

      // 0% Platform Fee Enforcement
      // We explicitly set platform fee to 0. 
      // The amountCents passed here should be the 'originalAmount' (Listing Price) 
      // which we collected from the buyer + fees.
      const platformFeeRate = 0;
      const platformFeeCents = 0;
      const transferAmountCents = amountCents;

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
        description: `Refund of ${refundAmount / 100} ${refund.currency.toUpperCase()} for payment ${paymentIntentId}`,
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

      // Normalize payload ONCE (Fastify-safe)
      const rawPayload = Buffer.isBuffer(rawBody)
        ? rawBody
        : Buffer.from(rawBody);

      console.log("🔄 StripeAdapter: Processing webhook event", {
        hasBody: !!rawBody,
        bodyLength: rawBody ? rawBody.length : 0,
        hasSignature: !!signature,
        hasSecret: !!endpointSecret
      });

      const bodyPreview = rawPayload.toString("utf8").slice(0, 50);
      console.log("🚨 [DIAGNOSTIC] WEBHOOK RECEIVED RAW:", bodyPreview + "...");

      if (!endpointSecret) {
        throw new WebhookVerificationError("Webhook endpoint secret not configured");
      }

      // Verify webhook signature
      console.log("🔍 StripeAdapter: Verifying webhook signature");
      const event = stripe.webhooks.constructEvent(
        rawPayload,
        signature,
        endpointSecret
      );

      console.log("✅ StripeAdapter: Webhook signature verified", {
        eventId: event.id,
        eventType: event.type,
        created: event.created
      });

      console.log(`🚨 [DIAGNOSTIC] Event Type Verified: ${event.type}`);

      // Store the raw event
      const webhookEvent = await WebhookEvent.createFromStripeEvent(event, "platform");

      console.log("💾 StripeAdapter: Webhook event stored", {
        webhookEventId: webhookEvent._id,
        stripeEventId: event.id,
        eventType: event.type
      });

      // Process the event asynchronously
      console.log("🚀 StripeAdapter: Starting async webhook processing");
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
    console.log("🔥 PROCESSING IN FILE:", __filename);
    try {
      const event = webhookEvent.rawData;

      console.log("🔄 StripeAdapter: Processing webhook event", {
        eventId: webhookEvent.stripeEventId,
        eventType: event.type,
        webhookEventId: webhookEvent._id
      });

      switch (event.type) {
        case "payment_intent.succeeded":
          console.log("💳 StripeAdapter: Handling payment_intent.succeeded");
          await this.handlePaymentIntentSucceeded(event);
          break;

        case "payment_intent.payment_failed":
          console.log("❌ StripeAdapter: Handling payment_intent.payment_failed");
          await this.handlePaymentIntentFailed(event);
          break;

        case "transfer.created":
          console.log("🔄 StripeAdapter: Handling transfer.created");
          await this.handleTransferCreated(event);
          break;

        case "transfer.updated":
          console.log("🔄 StripeAdapter: Handling transfer.updated");
          await this.handleTransferUpdated(event);
          break;

        case "account.updated":
          console.log("📄 StripeAdapter: Handling account.updated");
          await this.handleAccountUpdated(event);
          break;

        default:
          console.log(`⚠️ StripeAdapter: Unhandled webhook event type: ${event.type}`);
      }

      await webhookEvent.markAsProcessed();
      console.log("✅ StripeAdapter: Webhook event marked as processed", {
        eventId: webhookEvent.stripeEventId,
        eventType: event.type
      });

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

    // MANDATORY: FIRST LINE LOG
    console.log("📒 LEDGER SOURCE OF TRUTH HIT", paymentIntent.id);

    const operation = await PaymentOperation.getByStripeId(paymentIntent.id);

    console.log("✅ StripeAdapter: Handling payment_intent.succeeded", {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      operationFound: !!operation,
      metadata: paymentIntent.metadata
    });

    // ─────────────────────────────────────────────
    // Case 1: Normal marketplace checkout (Step 2+3)
    // ─────────────────────────────────────────────
    if (operation) {
      console.log("🔄 StripeAdapter: Marking operation as succeeded", {
        operationId: operation._id,
        paymentIntentId: paymentIntent.id
      });

      await operation.markAsSucceeded(paymentIntent);

      // ─────────────────────────────────────────
      // STEP 3: INTERNAL LEDGER CREATION (MANDATORY)
      // ─────────────────────────────────────────
      // NO return, NO checkoutGroupId dependency, NO async branching before this.
      try {
        // Idempotency check: ledger must be created exactly once
        const ledgerExists = await LedgerEntry.exists({
          related_payment_intent_id: paymentIntent.id,
          type: "payment_capture"
        });

        if (!ledgerExists) {
          // Query using paymentIntentId ONLY
          const orders = await Order.find({ paymentIntentId: paymentIntent.id });

          if (orders.length > 0) {
            console.log(`� Orders found: ${orders.length}`);

            // MANDATORY LOG BEFORE CALL
            console.log("📒 ABOUT TO CALL ledgerService.recordPaymentSuccess");

            await ledgerService.recordPaymentSuccess(paymentIntent, orders);

            console.log("📒 Ledger entries created");
          } else {
            console.warn("⚠️ No orders found for PaymentIntent, skipping ledger creation (expected for topups/pure-platform)", { paymentIntentId: paymentIntent.id });
          }
        } else {
          console.log("ℹ️ Ledger entries already exist for this payment intent", { paymentIntentId: paymentIntent.id });
        }
      } catch (ledgerError) {
        console.error("🚨 LEDGER CREATION FAILED", ledgerError);
        PaymentErrorHandler.logError(ledgerError, {
          context: "ledger_creation",
          paymentIntentId: paymentIntent.id
        });
      }

      // 🚫 DO NOT trigger CheckoutService here
      // Webhooks must NEVER perform delivery or stateful order mutations

      return;
    }

    // ─────────────────────────────────────────────
    // Case 2: Legacy wallet funding (pre-marketplace)
    // ─────────────────────────────────────────────
    const metadata = paymentIntent.metadata || {};

    console.log(
      "🔍 StripeAdapter: No operation found, checking legacy wallet funding",
      {
        paymentIntentId: paymentIntent.id,
        metadataType: metadata.type,
        hasUserId: !!metadata.userId,
        hasWalletId: !!metadata.walletId
      }
    );

    if (
      metadata.type === "wallet_funding" &&
      metadata.userId &&
      metadata.walletId
    ) {
      console.log("💰 StripeAdapter: Processing legacy wallet funding");
      await this.handleLegacyWalletFunding(paymentIntent);
    } else {
      console.log(
        "⚠️ StripeAdapter: Payment intent not recognized",
        { paymentIntentId: paymentIntent.id, metadata }
      );
    }
  }

  async handleLegacyWalletFunding(paymentIntent) {
    const { Transaction } = require("../../models/transaction");
    const { Wallet } = require("../../models/wallet");

    try {
      const metadata = paymentIntent.metadata;
      const userId = metadata.userId;
      const walletId = metadata.walletId;
      const amountCents = paymentIntent.amount;
      const amountDollars = amountCents / 100;

      console.log("🔄 StripeAdapter: Processing legacy wallet funding", {
        paymentIntentId: paymentIntent.id,
        userId,
        walletId,
        amountCents,
        amountDollars
      });

      // Get the wallet
      let wallet = await Wallet.findById(walletId);
      console.log("🔍 StripeAdapter: Wallet lookup", {
        walletId,
        walletFound: !!wallet,
        currentBalance: wallet?.balance
      });

      if (!wallet) {
        wallet = await Wallet.getWalletByUserId(userId);
        console.log("🔍 StripeAdapter: Fallback wallet lookup by userId", {
          userId,
          walletFound: !!wallet,
          walletId: wallet?._id
        });
      }

      if (wallet) {
        const balanceBefore = wallet.balance;

        // Add funds to wallet
        console.log("💰 StripeAdapter: Adding funds to wallet", {
          walletId: wallet._id,
          balanceBefore,
          amountDollars
        });

        await wallet.addFunds(amountDollars);

        // Refresh to get updated balance
        await wallet.reload();
        console.log("✅ StripeAdapter: Funds added to wallet", {
          walletId: wallet._id,
          balanceBefore,
          balanceAfter: wallet.balance,
          amountAdded: amountDollars
        });

        // Update existing pending transaction to completed
        const existingTransaction = await Transaction.getTransactionByPaymentIntent(paymentIntent.id);
        console.log("🔍 StripeAdapter: Looking for existing transaction", {
          paymentIntentId: paymentIntent.id,
          transactionFound: !!existingTransaction,
          transactionStatus: existingTransaction?.status
        });

        if (existingTransaction && existingTransaction.status === "pending") {
          console.log("🔄 StripeAdapter: Marking transaction as completed", {
            transactionId: existingTransaction._id,
            externalId: existingTransaction.externalId
          });
          await existingTransaction.markAsCompleted();
          console.log("✅ StripeAdapter: Transaction marked as completed");
        } else {
          console.log("⚠️ StripeAdapter: No pending transaction found or already processed", {
            paymentIntentId: paymentIntent.id,
            existingTransaction: !!existingTransaction,
            status: existingTransaction?.status
          });
        }
      } else {
        console.log("❌ StripeAdapter: No wallet found for legacy funding", {
          paymentIntentId: paymentIntent.id,
          userId,
          walletId
        });
      }
    } catch (error) {
      console.error("❌ StripeAdapter: Error in handleLegacyWalletFunding", {
        paymentIntentId: paymentIntent.id,
        error: error.message,
        stack: error.stack
      });

      PaymentErrorHandler.logError(error, {
        method: "handleLegacyWalletFunding",
        paymentIntentId: paymentIntent.id,
        userId: paymentIntent.metadata?.userId
      });
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
    } else {
      // Handle legacy wallet funding failures
      const metadata = paymentIntent.metadata || {};
      if (metadata.type === "wallet_funding" && metadata.userId && metadata.walletId) {
        await this.handleLegacyWalletFundingFailure(paymentIntent);
      }
    }
  }

  async handleLegacyWalletFundingFailure(paymentIntent) {
    const { Transaction } = require("../../models/transaction");

    try {
      // Update existing pending transaction to failed
      const existingTransaction = await Transaction.getTransactionByPaymentIntent(paymentIntent.id);
      if (existingTransaction && existingTransaction.status === "pending") {
        const errorMessage = paymentIntent.last_payment_error?.message || "Payment failed";
        await existingTransaction.markAsFailed(errorMessage);
      }
    } catch (error) {
      PaymentErrorHandler.logError(error, {
        method: "handleLegacyWalletFundingFailure",
        paymentIntentId: paymentIntent.id,
        userId: paymentIntent.metadata?.userId
      });
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