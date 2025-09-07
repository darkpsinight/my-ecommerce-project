const PaymentLogger = require("./paymentLogger");
const PaymentIntentProcessor = require("./eventProcessors/paymentIntentProcessor");
const TransferProcessor = require("./eventProcessors/transferProcessor");
const AccountProcessor = require("./eventProcessors/accountProcessor");
const { PaymentOperation } = require("../../models/paymentOperation");
const { StripeAccount } = require("../../models/stripeAccount");
const { WebhookEvent } = require("../../models/webhookEvent");
const { PaymentErrorHandler } = require("./paymentErrors");

class WebhookProcessor {
  constructor() {
    this.logger = new PaymentLogger();
    this.paymentIntentProcessor = new PaymentIntentProcessor();
    this.transferProcessor = new TransferProcessor();
    this.accountProcessor = new AccountProcessor();
    this.eventHandlers = new Map();
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    // Payment Intent events - delegate to specialized processor
    this.eventHandlers.set("payment_intent.succeeded", (event) => 
      this.paymentIntentProcessor.processPaymentIntentSucceeded(event));
    this.eventHandlers.set("payment_intent.payment_failed", (event) => 
      this.paymentIntentProcessor.processPaymentIntentFailed(event));
    this.eventHandlers.set("payment_intent.canceled", (event) => 
      this.paymentIntentProcessor.processPaymentIntentCanceled(event));
    this.eventHandlers.set("payment_intent.requires_action", (event) => 
      this.paymentIntentProcessor.processPaymentIntentRequiresAction(event));

    // Transfer events - delegate to specialized processor
    this.eventHandlers.set("transfer.created", (event) => 
      this.transferProcessor.processTransferCreated(event));
    this.eventHandlers.set("transfer.updated", (event) => 
      this.transferProcessor.processTransferUpdated(event));
    this.eventHandlers.set("transfer.paid", (event) => 
      this.transferProcessor.processTransferPaid(event));
    this.eventHandlers.set("transfer.failed", (event) => 
      this.transferProcessor.processTransferFailed(event));

    // Account events - delegate to specialized processor
    this.eventHandlers.set("account.updated", (event) => 
      this.accountProcessor.processAccountUpdated(event));
    this.eventHandlers.set("account.application.deauthorized", (event) => 
      this.accountProcessor.processAccountDeauthorized(event));
    this.eventHandlers.set("account.application.authorized", (event) => 
      this.accountProcessor.processAccountApplicationAuthorized(event));

    // Keep existing handlers for other events
    this.eventHandlers.set("payout.created", this.handlePayoutCreated.bind(this));
    this.eventHandlers.set("payout.updated", this.handlePayoutUpdated.bind(this));
    this.eventHandlers.set("payout.paid", this.handlePayoutPaid.bind(this));
    this.eventHandlers.set("payout.failed", this.handlePayoutFailed.bind(this));

    this.eventHandlers.set("charge.refunded", this.handleChargeRefunded.bind(this));
    this.eventHandlers.set("refund.created", this.handleRefundCreated.bind(this));
    this.eventHandlers.set("refund.updated", this.handleRefundUpdated.bind(this));

    this.eventHandlers.set("charge.dispute.created", this.handleDisputeCreated.bind(this));
    this.eventHandlers.set("charge.dispute.updated", this.handleDisputeUpdated.bind(this));
    this.eventHandlers.set("charge.dispute.closed", this.handleDisputeClosed.bind(this));
  }

  async processEvent(webhookEvent) {
    const startTime = Date.now();
    
    try {
      const event = webhookEvent.rawData;
      const handler = this.eventHandlers.get(event.type);

      if (!handler) {
        this.logger.logWebhookReceived(event, webhookEvent.source);
        console.log(`No handler for webhook event type: ${event.type}`);
        await webhookEvent.markAsProcessed();
        return { processed: true, handled: false };
      }

      this.logger.logWebhookReceived(event, webhookEvent.source);

      // Execute the specific event handler
      await handler(event, webhookEvent);

      // Mark as processed
      await webhookEvent.markAsProcessed();

      const processingTime = Date.now() - startTime;
      this.logger.logWebhookProcessed(event, processingTime);

      return { processed: true, handled: true, processingTime };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      await webhookEvent.recordProcessingError(error);
      this.logger.logWebhookFailed(webhookEvent.rawData, error, webhookEvent.processingAttempts + 1);

      PaymentErrorHandler.logError(error, {
        context: "webhook_processing",
        eventType: webhookEvent.type,
        eventId: webhookEvent.stripeEventId,
        processingTime
      });

      throw error;
    }
  }

  // Payment Intent Event Handlers

  async handlePaymentIntentSucceeded(event, webhookEvent) {
    const paymentIntent = event.data.object;
    const operation = await PaymentOperation.getByStripeId(paymentIntent.id);

    if (operation) {
      await operation.markAsSucceeded(paymentIntent);
      
      // Log successful payment for analytics
      this.logger.logOperationSuccess(
        { type: "payment_intent_succeeded", id: paymentIntent.id },
        { 
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          metadata: paymentIntent.metadata
        }
      );

      // Handle specific payment types
      if (paymentIntent.metadata?.type === "wallet_topup") {
        await this.handleWalletTopupSuccess(paymentIntent);
      } else if (paymentIntent.metadata?.type === "wallet_funding") {
        await this.handleLegacyWalletFundingSuccess(paymentIntent);
      } else if (paymentIntent.metadata?.type === "escrow_payment") {
        await this.handleEscrowPaymentSuccess(paymentIntent);
      }
    }
  }

  async handlePaymentIntentFailed(event, webhookEvent) {
    const paymentIntent = event.data.object;
    const operation = await PaymentOperation.getByStripeId(paymentIntent.id);

    if (operation) {
      const error = paymentIntent.last_payment_error;
      await operation.markAsFailed(
        error?.code || "payment_failed",
        error?.message || "Payment failed"
      );

      this.logger.logOperationFailure(
        { type: "payment_intent_failed", id: paymentIntent.id },
        new Error(error?.message || "Payment failed")
      );
    }
  }

  async handlePaymentIntentCanceled(event, webhookEvent) {
    const paymentIntent = event.data.object;
    const operation = await PaymentOperation.getByStripeId(paymentIntent.id);

    if (operation) {
      await operation.markAsCanceled();
    }
  }

  async handlePaymentIntentRequiresAction(event, webhookEvent) {
    const paymentIntent = event.data.object;
    
    // Log that payment requires additional action (3D Secure, etc.)
    this.logger.logOperationStart(
      { type: "payment_requires_action", id: paymentIntent.id },
      { 
        nextAction: paymentIntent.next_action?.type,
        metadata: paymentIntent.metadata
      }
    );
  }

  // Transfer Event Handlers

  async handleTransferCreated(event, webhookEvent) {
    const transfer = event.data.object;
    const operation = await PaymentOperation.getByStripeId(transfer.id);

    if (operation) {
      // Transfer created successfully
      this.logger.logOperationSuccess(
        { type: "transfer_created", id: transfer.id },
        {
          amount: transfer.amount,
          destination: transfer.destination,
          metadata: transfer.metadata
        }
      );
    }
  }

  async handleTransferUpdated(event, webhookEvent) {
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

  async handleTransferPaid(event, webhookEvent) {
    const transfer = event.data.object;
    const operation = await PaymentOperation.getByStripeId(transfer.id);

    if (operation) {
      await operation.markAsSucceeded(transfer);
      
      this.logger.logOperationSuccess(
        { type: "transfer_paid", id: transfer.id },
        {
          amount: transfer.amount,
          destination: transfer.destination
        }
      );
    }
  }

  async handleTransferFailed(event, webhookEvent) {
    const transfer = event.data.object;
    const operation = await PaymentOperation.getByStripeId(transfer.id);

    if (operation) {
      await operation.markAsFailed("transfer_failed", transfer.failure_message || "Transfer failed");
      
      this.logger.logOperationFailure(
        { type: "transfer_failed", id: transfer.id },
        new Error(transfer.failure_message || "Transfer failed")
      );
    }
  }

  // Account Event Handlers

  async handleAccountUpdated(event, webhookEvent) {
    const account = event.data.object;
    const stripeAccount = await StripeAccount.getByStripeAccountId(account.id);

    if (stripeAccount) {
      const previousStatus = stripeAccount.status;
      await stripeAccount.updateFromStripeAccount(account);

      // Log significant status changes
      if (previousStatus !== stripeAccount.status) {
        this.logger.logOperationSuccess(
          { type: "account_status_changed", id: account.id },
          {
            from: previousStatus,
            to: stripeAccount.status,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled
          }
        );
      }

      // Handle account verification completion
      if (account.charges_enabled && account.payouts_enabled && !stripeAccount.migrated) {
        await this.handleAccountVerificationComplete(stripeAccount);
      }
    }
  }

  async handleAccountDeauthorized(event, webhookEvent) {
    const account = event.data.object;
    
    this.logger.logSecurityEvent("account_deauthorized", {
      accountId: account.id,
      reason: "Application access revoked by account holder"
    });

    // Handle account deauthorization - disable transfers, notify admins, etc.
    const stripeAccount = await StripeAccount.getByStripeAccountId(account.id);
    if (stripeAccount) {
      // Mark account as deauthorized
      stripeAccount.status = "restricted";
      stripeAccount.metadata = {
        ...stripeAccount.metadata,
        deauthorized: true,
        deauthorizedAt: new Date()
      };
      await stripeAccount.save();
    }
  }

  // Payout Event Handlers

  async handlePayoutCreated(event, webhookEvent) {
    const payout = event.data.object;
    
    this.logger.logOperationStart(
      { type: "payout_created", id: payout.id },
      {
        amount: payout.amount,
        currency: payout.currency,
        method: payout.method,
        destination: payout.destination
      }
    );
  }

  async handlePayoutUpdated(event, webhookEvent) {
    const payout = event.data.object;
    
    if (payout.status === "paid") {
      this.logger.logOperationSuccess(
        { type: "payout_paid", id: payout.id },
        { amount: payout.amount, currency: payout.currency }
      );
    } else if (payout.status === "failed") {
      this.logger.logOperationFailure(
        { type: "payout_failed", id: payout.id },
        new Error(payout.failure_message || "Payout failed")
      );
    }
  }

  async handlePayoutPaid(event, webhookEvent) {
    const payout = event.data.object;
    
    this.logger.logOperationSuccess(
      { type: "payout_completed", id: payout.id },
      {
        amount: payout.amount,
        currency: payout.currency,
        arrivalDate: payout.arrival_date
      }
    );
  }

  async handlePayoutFailed(event, webhookEvent) {
    const payout = event.data.object;
    
    this.logger.logOperationFailure(
      { type: "payout_failed", id: payout.id },
      new Error(payout.failure_message || "Payout failed")
    );
  }

  // Refund Event Handlers

  async handleChargeRefunded(event, webhookEvent) {
    const charge = event.data.object;
    
    // Handle refund completion
    this.logger.logOperationSuccess(
      { type: "charge_refunded", id: charge.id },
      {
        amountRefunded: charge.amount_refunded,
        refunds: charge.refunds.data.length
      }
    );
  }

  async handleRefundCreated(event, webhookEvent) {
    const refund = event.data.object;
    const operation = await PaymentOperation.getByStripeId(refund.id);

    if (operation) {
      this.logger.logOperationSuccess(
        { type: "refund_created", id: refund.id },
        {
          amount: refund.amount,
          reason: refund.reason,
          status: refund.status
        }
      );
    }
  }

  async handleRefundUpdated(event, webhookEvent) {
    const refund = event.data.object;
    const operation = await PaymentOperation.getByStripeId(refund.id);

    if (operation) {
      if (refund.status === "succeeded") {
        await operation.markAsSucceeded(refund);
      } else if (refund.status === "failed") {
        await operation.markAsFailed("refund_failed", refund.failure_reason || "Refund failed");
      }
    }
  }

  // Dispute Event Handlers

  async handleDisputeCreated(event, webhookEvent) {
    const dispute = event.data.object;
    
    this.logger.logSecurityEvent("dispute_created", {
      disputeId: dispute.id,
      chargeId: dispute.charge,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status
    });

    // TODO: Integrate with dispute management system
    // - Create dispute record in database
    // - Notify admins
    // - Gather evidence
  }

  async handleDisputeUpdated(event, webhookEvent) {
    const dispute = event.data.object;
    
    this.logger.logOperationSuccess(
      { type: "dispute_updated", id: dispute.id },
      {
        status: dispute.status,
        reason: dispute.reason
      }
    );
  }

  async handleDisputeClosed(event, webhookEvent) {
    const dispute = event.data.object;
    
    this.logger.logOperationSuccess(
      { type: "dispute_closed", id: dispute.id },
      {
        status: dispute.status,
        outcome: dispute.outcome
      }
    );
  }

  // Helper Methods

  async handleWalletTopupSuccess(paymentIntent) {
    // Handle successful wallet top-up
    // This would integrate with wallet service to credit the buyer's wallet
    this.logger.logOperationSuccess(
      { type: "wallet_topup_success", id: paymentIntent.id },
      {
        buyerId: paymentIntent.metadata?.buyerId,
        amount: paymentIntent.amount
      }
    );
  }

  async handleLegacyWalletFundingSuccess(paymentIntent) {
    // Handle successful legacy wallet funding
    // This integrates with wallet service to credit the buyer's wallet
    this.logger.logOperationSuccess(
      { type: "legacy_wallet_funding_success", id: paymentIntent.id },
      {
        userId: paymentIntent.metadata?.userId,
        amount: paymentIntent.amount
      }
    );
  }

  async handleEscrowPaymentSuccess(paymentIntent) {
    // Handle successful escrow payment
    // This would update the escrow status and potentially trigger product delivery
    this.logger.logOperationSuccess(
      { type: "escrow_payment_success", id: paymentIntent.id },
      {
        buyerId: paymentIntent.metadata?.buyerId,
        escrowId: paymentIntent.metadata?.escrowId,
        amount: paymentIntent.amount
      }
    );
  }

  async handleAccountVerificationComplete(stripeAccount) {
    // Handle account verification completion
    stripeAccount.migrated = true;
    stripeAccount.migratedAt = new Date();
    await stripeAccount.save();

    this.logger.logOperationSuccess(
      { type: "account_verification_complete", id: stripeAccount.stripeAccountId },
      {
        sellerId: stripeAccount.sellerId,
        capabilities: stripeAccount.capabilities
      }
    );
  }

  // Utility Methods

  getSupportedEventTypes() {
    return Array.from(this.eventHandlers.keys());
  }

  async getProcessingStats(timeRange = 24) {
    const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
    
    const stats = await WebhookEvent.aggregate([
      { $match: { createdAt: { $gte: startTime } } },
      {
        $group: {
          _id: "$type",
          total: { $sum: 1 },
          processed: { $sum: { $cond: ["$processed", 1, 0] } },
          failed: { $sum: { $cond: [{ $gt: ["$processingAttempts", 0] }, 1, 0] } },
          avgProcessingTime: { $avg: "$processingTime" }
        }
      },
      { $sort: { total: -1 } }
    ]);

    return stats;
  }
}

module.exports = WebhookProcessor;