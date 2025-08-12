const PaymentLogger = require("../paymentLogger");
const { PaymentOperation } = require("../../../models/paymentOperation");
const { Wallet } = require("../../../models/wallet");
const { Order } = require("../../../models/order");
const { Transaction } = require("../../../models/transaction");
const { PaymentErrorHandler } = require("../paymentErrors");

class PaymentIntentProcessor {
  constructor() {
    this.logger = new PaymentLogger();
  }

  async processPaymentIntentSucceeded(event) {
    const paymentIntent = event.data.object;
    const correlationId = this.logger.logOperationStart(
      { type: "process_payment_intent_succeeded", id: paymentIntent.id },
      { amount: paymentIntent.amount, currency: paymentIntent.currency }
    );

    try {
      // Get the payment operation record
      const operation = await PaymentOperation.getByStripeId(paymentIntent.id);
      if (!operation) {
        this.logger.logOperationFailure(
          { type: "process_payment_intent_succeeded", id: paymentIntent.id },
          new Error("Payment operation not found"),
          correlationId
        );
        return { processed: false, reason: "operation_not_found" };
      }

      // Check if already processed (idempotency)
      if (operation.status === "succeeded") {
        return { processed: true, reason: "already_processed" };
      }

      // Update operation status
      await operation.markAsSucceeded(paymentIntent);

      // Process based on payment type
      const metadata = paymentIntent.metadata || {};
      let result;

      switch (metadata.type) {
        case "wallet_topup":
          result = await this.processWalletTopup(paymentIntent, operation);
          break;
        case "escrow_payment":
          result = await this.processEscrowPayment(paymentIntent, operation);
          break;
        default:
          result = await this.processGenericPayment(paymentIntent, operation);
      }

      this.logger.logOperationSuccess(
        { type: "process_payment_intent_succeeded", id: paymentIntent.id },
        result,
        correlationId
      );

      return { processed: true, result };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_payment_intent_succeeded", id: paymentIntent.id },
        error,
        correlationId
      );
      throw error;
    }
  }

  async processPaymentIntentFailed(event) {
    const paymentIntent = event.data.object;
    const correlationId = this.logger.logOperationStart(
      { type: "process_payment_intent_failed", id: paymentIntent.id }
    );

    try {
      const operation = await PaymentOperation.getByStripeId(paymentIntent.id);
      if (!operation) {
        return { processed: false, reason: "operation_not_found" };
      }

      // Check if already processed
      if (operation.status === "failed") {
        return { processed: true, reason: "already_processed" };
      }

      const error = paymentIntent.last_payment_error;
      await operation.markAsFailed(
        error?.code || "payment_failed",
        error?.message || "Payment failed"
      );

      // Handle failure based on payment type
      const metadata = paymentIntent.metadata || {};
      let result;

      switch (metadata.type) {
        case "wallet_topup":
          result = await this.handleWalletTopupFailure(paymentIntent, operation);
          break;
        case "escrow_payment":
          result = await this.handleEscrowPaymentFailure(paymentIntent, operation);
          break;
        default:
          result = { type: "generic_failure", handled: true };
      }

      this.logger.logOperationSuccess(
        { type: "process_payment_intent_failed", id: paymentIntent.id },
        result,
        correlationId
      );

      return { processed: true, result };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_payment_intent_failed", id: paymentIntent.id },
        error,
        correlationId
      );
      throw error;
    }
  }

  async processPaymentIntentCanceled(event) {
    const paymentIntent = event.data.object;
    
    try {
      const operation = await PaymentOperation.getByStripeId(paymentIntent.id);
      if (!operation) {
        return { processed: false, reason: "operation_not_found" };
      }

      // Check if already processed
      if (operation.status === "canceled") {
        return { processed: true, reason: "already_processed" };
      }

      await operation.markAsCanceled();

      // Handle cancellation cleanup
      const metadata = paymentIntent.metadata || {};
      if (metadata.escrowId) {
        await this.handleEscrowCancellation(metadata.escrowId);
      }

      return { processed: true, result: { type: "cancellation", handled: true } };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_payment_intent_canceled", id: paymentIntent.id },
        error
      );
      throw error;
    }
  }

  async processPaymentIntentRequiresAction(event) {
    const paymentIntent = event.data.object;
    
    try {
      // Log that payment requires additional action (3D Secure, etc.)
      this.logger.logOperationStart(
        { type: "payment_requires_action", id: paymentIntent.id },
        { 
          nextAction: paymentIntent.next_action?.type,
          metadata: paymentIntent.metadata
        }
      );

      // Update operation status if exists
      const operation = await PaymentOperation.getByStripeId(paymentIntent.id);
      if (operation && operation.status !== "requires_action") {
        operation.status = "requires_action";
        await operation.save();
      }

      return { processed: true, result: { requiresAction: true } };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_payment_intent_requires_action", id: paymentIntent.id },
        error
      );
      throw error;
    }
  }

  // Private helper methods

  async processWalletTopup(paymentIntent, operation) {
    const metadata = paymentIntent.metadata;
    const buyerId = metadata.buyerId;
    const amountCents = paymentIntent.amount;

    if (!buyerId) {
      throw new Error("Buyer ID not found in payment intent metadata");
    }

    try {
      // Get or create wallet
      let wallet = await Wallet.getWalletByUserId(buyerId);
      if (!wallet) {
        wallet = await Wallet.createWalletForUser(buyerId, paymentIntent.currency.toUpperCase());
      }

      // Add funds to wallet (convert cents to dollars)
      const amountDollars = amountCents / 100;
      await wallet.addFunds(amountDollars);

      // Create transaction record
      await Transaction.createFundingTransaction({
        walletId: wallet._id,
        userId: buyerId,
        amount: amountDollars,
        currency: paymentIntent.currency.toUpperCase(),
        paymentIntentId: paymentIntent.id,
        balanceBefore: wallet.balance - amountDollars
      });

      return {
        type: "wallet_topup",
        buyerId,
        amountCents,
        newBalanceCents: Math.round(wallet.balance * 100),
        transactionCreated: true
      };

    } catch (error) {
      // If wallet update fails, we should mark the operation as failed
      await operation.markAsFailed("wallet_update_failed", error.message);
      throw error;
    }
  }

  async processEscrowPayment(paymentIntent, operation) {
    const metadata = paymentIntent.metadata;
    const escrowId = metadata.escrowId;
    const buyerId = metadata.buyerId;

    if (!escrowId) {
      throw new Error("Escrow ID not found in payment intent metadata");
    }

    try {
      // Update order status to charged
      const order = await Order.findById(escrowId);
      if (order) {
        order.status = "processing";
        order.paymentIntentId = paymentIntent.id;
        order.processedAt = new Date();
        await order.save();

        // Mark as delivered (in a real system, this would trigger product delivery)
        await order.markAsCompleted();
      }

      return {
        type: "escrow_payment",
        escrowId,
        buyerId,
        amountCents: paymentIntent.amount,
        orderUpdated: !!order,
        orderStatus: order?.status
      };

    } catch (error) {
      await operation.markAsFailed("escrow_update_failed", error.message);
      throw error;
    }
  }

  async processGenericPayment(paymentIntent, operation) {
    // Handle generic payments that don't have specific types
    return {
      type: "generic_payment",
      paymentIntentId: paymentIntent.id,
      amountCents: paymentIntent.amount,
      currency: paymentIntent.currency,
      processed: true
    };
  }

  async handleWalletTopupFailure(paymentIntent, operation) {
    const metadata = paymentIntent.metadata;
    const buyerId = metadata.buyerId;

    // Log the failure for analytics
    this.logger.logOperationFailure(
      { type: "wallet_topup_failed", id: buyerId },
      new Error(paymentIntent.last_payment_error?.message || "Wallet topup failed")
    );

    // Could implement retry logic or user notification here
    return {
      type: "wallet_topup_failure",
      buyerId,
      errorCode: paymentIntent.last_payment_error?.code,
      errorMessage: paymentIntent.last_payment_error?.message,
      handled: true
    };
  }

  async handleEscrowPaymentFailure(paymentIntent, operation) {
    const metadata = paymentIntent.metadata;
    const escrowId = metadata.escrowId;

    try {
      // Update order status to failed
      const order = await Order.findById(escrowId);
      if (order) {
        await order.markAsFailed(paymentIntent.last_payment_error?.message || "Payment failed");
      }

      return {
        type: "escrow_payment_failure",
        escrowId,
        orderUpdated: !!order,
        errorCode: paymentIntent.last_payment_error?.code,
        handled: true
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "handle_escrow_payment_failure", id: escrowId },
        error
      );
      return {
        type: "escrow_payment_failure",
        escrowId,
        orderUpdated: false,
        error: error.message,
        handled: false
      };
    }
  }

  async handleEscrowCancellation(escrowId) {
    try {
      const order = await Order.findById(escrowId);
      if (order && order.status === "pending") {
        order.status = "cancelled";
        await order.save();
      }
    } catch (error) {
      this.logger.logOperationFailure(
        { type: "handle_escrow_cancellation", id: escrowId },
        error
      );
    }
  }

  // Utility methods

  async getPaymentIntentStats(timeRange = 24) {
    const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
    
    const stats = await PaymentOperation.aggregate([
      { 
        $match: { 
          type: "charge",
          createdAt: { $gte: startTime },
          stripeId: { $regex: /^pi_/ } // Payment Intent IDs start with pi_
        } 
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amountCents" },
          avgAmount: { $avg: "$amountCents" }
        }
      }
    ]);

    return stats;
  }

  async retryFailedPaymentIntent(paymentIntentId) {
    try {
      const operation = await PaymentOperation.getByStripeId(paymentIntentId);
      if (!operation || operation.status !== "failed") {
        throw new Error("Operation not found or not in failed status");
      }

      // Reset operation status for retry
      operation.status = "pending";
      operation.retryCount = (operation.retryCount || 0) + 1;
      await operation.save();

      return {
        retried: true,
        operationId: operation._id,
        retryCount: operation.retryCount
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "retry_failed_payment_intent", id: paymentIntentId },
        error
      );
      throw error;
    }
  }
}

module.exports = PaymentIntentProcessor;