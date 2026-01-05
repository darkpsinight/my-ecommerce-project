const PaymentLogger = require("../paymentLogger");
const { PaymentOperation } = require("../../../models/paymentOperation");

const { Wallet } = require("../../../models/wallet");
const { Order } = require("../../../models/order");
const { Transaction } = require("../../../models/transaction");
const { LedgerEntry } = require("../../../models/ledgerEntry");
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

    // Add comprehensive debugging logs
    console.log("🔄 PaymentIntentProcessor: Processing payment_intent.succeeded", {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata
    });

    console.log("🚨 [DIAGNOSTIC] PROCESSOR CALLED: payment_intent.succeeded for", paymentIntent.id);

    try {
      // Get the payment operation record
      const operation = await PaymentOperation.getByStripeId(paymentIntent.id);

      console.log("🔍 PaymentIntentProcessor: Operation lookup result", {
        paymentIntentId: paymentIntent.id,
        operationFound: !!operation,
        operationId: operation?._id,
        operationStatus: operation?.status
      });

      // Handle legacy wallet funding that doesn't have PaymentOperation records
      if (!operation) {
        const metadata = paymentIntent.metadata || {};

        console.log("⚠️ PaymentIntentProcessor: No operation found, checking for legacy wallet funding", {
          paymentIntentId: paymentIntent.id,
          metadataType: metadata.type,
          hasUserId: !!metadata.userId,
          hasWalletId: !!metadata.walletId
        });

        // Check if this is legacy wallet funding
        if (metadata.type === "wallet_funding" && metadata.userId && metadata.walletId) {
          console.log("✅ PaymentIntentProcessor: Processing as legacy wallet funding", {
            paymentIntentId: paymentIntent.id,
            userId: metadata.userId,
            walletId: metadata.walletId,
            amount: paymentIntent.amount
          });

          this.logger.logOperationStart(
            { type: "process_legacy_wallet_funding", id: paymentIntent.id },
            { userId: metadata.userId, amount: paymentIntent.amount }
          );

          // Create a dummy operation for consistency
          const dummyOperation = {
            markAsSucceeded: async () => {
              console.log("✅ PaymentIntentProcessor: Legacy funding marked as succeeded", paymentIntent.id);
            },
            markAsFailed: async (code, message) => {
              console.log("❌ PaymentIntentProcessor: Legacy funding marked as failed", {
                paymentIntentId: paymentIntent.id,
                code,
                message
              });
              this.logger.logOperationFailure(
                { type: "legacy_wallet_funding_failed", id: paymentIntent.id },
                new Error(`${code}: ${message}`)
              );
            }
          };

          const result = await this.processLegacyWalletFunding(paymentIntent, dummyOperation);

          console.log("🎉 PaymentIntentProcessor: Legacy wallet funding completed", {
            paymentIntentId: paymentIntent.id,
            result
          });

          this.logger.logOperationSuccess(
            { type: "process_legacy_wallet_funding", id: paymentIntent.id },
            result,
            correlationId
          );

          return { processed: true, result };
        }

        console.log("❌ PaymentIntentProcessor: Not a recognized legacy wallet funding", {
          paymentIntentId: paymentIntent.id,
          metadata
        });

        this.logger.logOperationFailure(
          { type: "process_payment_intent_succeeded", id: paymentIntent.id },
          new Error("Payment operation not found"),
          correlationId
        );
        return { processed: false, reason: "operation_not_found" };
      }



      // Check if already processed (idempotency)
      if (operation.status === "succeeded") {
        console.log("🚨 [DIAGNOSTIC] SKIPPING LEDGER: Operation already 'succeeded' (likely via Fast Path). Ledger logic bypassed.");
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
        case "wallet_funding": // Legacy wallet funding support
          result = await this.processLegacyWalletFunding(paymentIntent, operation);
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
        case "wallet_funding": // Legacy wallet funding support
          result = await this.handleLegacyWalletFundingFailure(paymentIntent, operation);
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

  async processLegacyWalletFunding(paymentIntent, operation) {
    const metadata = paymentIntent.metadata;
    const userId = metadata.userId; // Legacy uses userId instead of buyerId
    const walletId = metadata.walletId;
    const amountCents = paymentIntent.amount;

    console.log("🔄 Processing legacy wallet funding", {
      paymentIntentId: paymentIntent.id,
      userId,
      walletId,
      amountCents,
      amountDollars: amountCents / 100
    });

    if (!userId) {
      throw new Error("User ID not found in payment intent metadata");
    }

    try {
      // Get the wallet
      let wallet = await Wallet.findById(walletId);
      console.log("🔍 Wallet lookup by ID result", {
        walletId,
        walletFound: !!wallet,
        currentBalance: wallet?.balance
      });

      if (!wallet) {
        // Fallback: try to get wallet by userId
        console.log("🔄 Fallback: Looking up wallet by userId", userId);
        wallet = await Wallet.getWalletByUserId(userId);
        console.log("🔍 Wallet lookup by userId result", {
          userId,
          walletFound: !!wallet,
          walletId: wallet?._id,
          currentBalance: wallet?.balance
        });

        if (!wallet) {
          console.log("🆕 Creating new wallet for user", userId);
          wallet = await Wallet.createWalletForUser(userId, paymentIntent.currency.toUpperCase());
          console.log("✅ New wallet created", {
            walletId: wallet._id,
            userId,
            currency: wallet.currency
          });
        }
      }

      const balanceBefore = wallet.balance;

      // Add funds to wallet (convert cents to dollars)
      const amountDollars = amountCents / 100;
      console.log("💰 Adding funds to wallet", {
        walletId: wallet._id,
        balanceBefore,
        amountDollars,
        expectedBalanceAfter: balanceBefore + amountDollars
      });

      await wallet.addFunds(amountDollars);

      // Refresh wallet to get updated balance
      await wallet.reload();
      const balanceAfter = wallet.balance;

      console.log("✅ Wallet funds added", {
        walletId: wallet._id,
        balanceBefore,
        balanceAfter,
        amountAdded: amountDollars,
        success: Math.abs(balanceAfter - (balanceBefore + amountDollars)) < 0.01
      });

      // Update existing pending transaction to completed
      const existingTransaction = await Transaction.getTransactionByPaymentIntent(paymentIntent.id);
      console.log("🔍 Looking for existing transaction", {
        paymentIntentId: paymentIntent.id,
        transactionFound: !!existingTransaction,
        transactionId: existingTransaction?._id,
        currentStatus: existingTransaction?.status
      });

      if (existingTransaction && existingTransaction.status === "pending") {
        console.log("🔄 Marking existing transaction as completed", {
          transactionId: existingTransaction._id,
          externalId: existingTransaction.externalId
        });
        await existingTransaction.markAsCompleted();
        console.log("✅ Transaction marked as completed");
      } else {
        // Create new transaction record if none exists
        console.log("🆕 Creating new transaction record");
        const newTransaction = await Transaction.create({
          walletId: wallet._id,
          userId,
          type: "funding",
          amount: amountDollars,
          currency: paymentIntent.currency.toUpperCase(),
          status: "completed",
          description: `Wallet funding of ${amountDollars} ${paymentIntent.currency.toUpperCase()}`,
          paymentProvider: "stripe",
          paymentIntentId: paymentIntent.id,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          processedAt: new Date()
        });
        console.log("✅ New transaction created", {
          transactionId: newTransaction._id,
          externalId: newTransaction.externalId
        });
      }

      const result = {
        type: "legacy_wallet_funding",
        userId,
        amountCents,
        newBalanceCents: Math.round(balanceAfter * 100),
        transactionCompleted: true,
        walletId: wallet._id
      };

      console.log("🎉 Legacy wallet funding processing completed", result);
      return result;

    } catch (error) {
      console.error("❌ Error processing legacy wallet funding", {
        paymentIntentId: paymentIntent.id,
        userId,
        error: error.message,
        stack: error.stack
      });

      // If wallet update fails, we should mark the operation as failed
      await operation.markAsFailed("wallet_update_failed", error.message);
      throw error;
    }
  }

  async processGenericPayment(paymentIntent, operation) {
    // Handle generic payments that don't have specific types
    // Check if this might be a legacy wallet funding without operation record
    const metadata = paymentIntent.metadata || {};

    // If it looks like wallet funding but has no operation, try to handle it
    if ((metadata.type === "wallet_funding" || metadata.walletId) && metadata.userId) {
      return await this.processLegacyWalletFunding(paymentIntent, operation);
    }

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

  async handleLegacyWalletFundingFailure(paymentIntent, operation) {
    const metadata = paymentIntent.metadata;
    const userId = metadata.userId;

    // Log the failure for analytics
    this.logger.logOperationFailure(
      { type: "legacy_wallet_funding_failed", id: userId },
      new Error(paymentIntent.last_payment_error?.message || "Legacy wallet funding failed")
    );

    // Update existing pending transaction to failed
    try {
      const existingTransaction = await Transaction.getTransactionByPaymentIntent(paymentIntent.id);
      if (existingTransaction && existingTransaction.status === "pending") {
        await existingTransaction.markAsFailed(paymentIntent.last_payment_error?.message || "Payment failed");
      }
    } catch (error) {
      this.logger.logOperationFailure(
        { type: "update_transaction_failed", id: paymentIntent.id },
        error
      );
    }

    return {
      type: "legacy_wallet_funding_failure",
      userId,
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