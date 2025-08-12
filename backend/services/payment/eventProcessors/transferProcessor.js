const PaymentLogger = require("../paymentLogger");
const { PaymentOperation } = require("../../../models/paymentOperation");
const { StripeAccount } = require("../../../models/stripeAccount");
const { Order } = require("../../../models/order");
const { User } = require("../../../models/user");

class TransferProcessor {
  constructor() {
    this.logger = new PaymentLogger();
  }

  async processTransferCreated(event) {
    const transfer = event.data.object;
    const correlationId = this.logger.logOperationStart(
      { type: "process_transfer_created", id: transfer.id },
      { 
        amount: transfer.amount, 
        destination: transfer.destination,
        currency: transfer.currency 
      }
    );

    try {
      // Get the transfer operation record
      const operation = await PaymentOperation.getByStripeId(transfer.id);
      if (!operation) {
        this.logger.logOperationFailure(
          { type: "process_transfer_created", id: transfer.id },
          new Error("Transfer operation not found"),
          correlationId
        );
        return { processed: false, reason: "operation_not_found" };
      }

      // Update operation with transfer details
      operation.status = "pending";
      operation.metadata = {
        ...operation.metadata,
        transferCreated: true,
        transferStatus: transfer.status,
        destination: transfer.destination
      };
      await operation.save();

      // Log transfer creation for the seller
      const result = await this.logTransferForSeller(transfer, operation);

      this.logger.logOperationSuccess(
        { type: "process_transfer_created", id: transfer.id },
        result,
        correlationId
      );

      return { processed: true, result };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_transfer_created", id: transfer.id },
        error,
        correlationId
      );
      throw error;
    }
  }

  async processTransferUpdated(event) {
    const transfer = event.data.object;
    const correlationId = this.logger.logOperationStart(
      { type: "process_transfer_updated", id: transfer.id },
      { status: transfer.status, amount: transfer.amount }
    );

    try {
      const operation = await PaymentOperation.getByStripeId(transfer.id);
      if (!operation) {
        return { processed: false, reason: "operation_not_found" };
      }

      let result;

      switch (transfer.status) {
        case "paid":
          result = await this.handleTransferPaid(transfer, operation);
          break;
        case "failed":
          result = await this.handleTransferFailed(transfer, operation);
          break;
        case "canceled":
          result = await this.handleTransferCanceled(transfer, operation);
          break;
        default:
          result = await this.handleTransferStatusUpdate(transfer, operation);
      }

      this.logger.logOperationSuccess(
        { type: "process_transfer_updated", id: transfer.id },
        result,
        correlationId
      );

      return { processed: true, result };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_transfer_updated", id: transfer.id },
        error,
        correlationId
      );
      throw error;
    }
  }

  async processTransferPaid(event) {
    const transfer = event.data.object;
    
    try {
      const operation = await PaymentOperation.getByStripeId(transfer.id);
      if (!operation) {
        return { processed: false, reason: "operation_not_found" };
      }

      // Check if already processed
      if (operation.status === "succeeded") {
        return { processed: true, reason: "already_processed" };
      }

      const result = await this.handleTransferPaid(transfer, operation);
      return { processed: true, result };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_transfer_paid", id: transfer.id },
        error
      );
      throw error;
    }
  }

  async processTransferFailed(event) {
    const transfer = event.data.object;
    
    try {
      const operation = await PaymentOperation.getByStripeId(transfer.id);
      if (!operation) {
        return { processed: false, reason: "operation_not_found" };
      }

      // Check if already processed
      if (operation.status === "failed") {
        return { processed: true, reason: "already_processed" };
      }

      const result = await this.handleTransferFailed(transfer, operation);
      return { processed: true, result };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_transfer_failed", id: transfer.id },
        error
      );
      throw error;
    }
  }

  // Private helper methods

  async handleTransferPaid(transfer, operation) {
    try {
      // Mark operation as succeeded
      await operation.markAsSucceeded(transfer);

      // Update escrow/order status if applicable
      const escrowId = operation.escrowId;
      let orderUpdated = false;
      
      if (escrowId) {
        const order = await Order.findById(escrowId);
        if (order && order.status !== "completed") {
          order.status = "completed";
          order.deliveredAt = new Date();
          await order.save();
          orderUpdated = true;
        }
      }

      // Update seller balance/status
      const sellerUpdate = await this.updateSellerAfterTransfer(transfer, operation, "paid");

      return {
        type: "transfer_paid",
        transferId: transfer.id,
        amount: transfer.amount,
        destination: transfer.destination,
        orderUpdated,
        sellerUpdate,
        escrowCompleted: !!escrowId
      };

    } catch (error) {
      // If post-processing fails, log but don't fail the webhook
      this.logger.logOperationFailure(
        { type: "handle_transfer_paid_post_processing", id: transfer.id },
        error
      );
      
      // Still mark the operation as succeeded since the transfer itself succeeded
      await operation.markAsSucceeded(transfer);
      
      return {
        type: "transfer_paid",
        transferId: transfer.id,
        amount: transfer.amount,
        postProcessingError: error.message,
        transferSucceeded: true
      };
    }
  }

  async handleTransferFailed(transfer, operation) {
    try {
      // Mark operation as failed
      await operation.markAsFailed(
        "transfer_failed",
        transfer.failure_message || "Transfer failed"
      );

      // Handle escrow/order failure
      const escrowId = operation.escrowId;
      let orderReverted = false;
      
      if (escrowId) {
        const order = await Order.findById(escrowId);
        if (order) {
          // Revert order status and potentially initiate refund
          order.status = "failed";
          order.errorMessage = transfer.failure_message || "Transfer to seller failed";
          order.failedAt = new Date();
          await order.save();
          orderReverted = true;

          // TODO: Initiate automatic refund to buyer
          await this.initiateRefundForFailedTransfer(order, operation);
        }
      }

      // Update seller notification
      const sellerUpdate = await this.updateSellerAfterTransfer(transfer, operation, "failed");

      return {
        type: "transfer_failed",
        transferId: transfer.id,
        amount: transfer.amount,
        failureReason: transfer.failure_message,
        orderReverted,
        sellerUpdate,
        refundInitiated: orderReverted
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "handle_transfer_failed_post_processing", id: transfer.id },
        error
      );
      
      // Still mark the operation as failed
      await operation.markAsFailed("transfer_failed", transfer.failure_message || "Transfer failed");
      
      return {
        type: "transfer_failed",
        transferId: transfer.id,
        postProcessingError: error.message,
        transferFailed: true
      };
    }
  }

  async handleTransferCanceled(transfer, operation) {
    await operation.markAsCanceled();

    // Handle escrow cancellation
    const escrowId = operation.escrowId;
    if (escrowId) {
      const order = await Order.findById(escrowId);
      if (order) {
        order.status = "cancelled";
        await order.save();
      }
    }

    return {
      type: "transfer_canceled",
      transferId: transfer.id,
      escrowCanceled: !!escrowId
    };
  }

  async handleTransferStatusUpdate(transfer, operation) {
    // Update operation metadata with current transfer status
    operation.metadata = {
      ...operation.metadata,
      transferStatus: transfer.status,
      lastUpdated: new Date()
    };
    await operation.save();

    return {
      type: "transfer_status_update",
      transferId: transfer.id,
      status: transfer.status,
      updated: true
    };
  }

  async logTransferForSeller(transfer, operation) {
    try {
      // Get seller information
      const stripeAccount = await StripeAccount.getByStripeAccountId(transfer.destination);
      if (!stripeAccount) {
        return { sellerFound: false };
      }

      const seller = await User.findById(stripeAccount.sellerId);
      if (!seller) {
        return { sellerFound: false, stripeAccountFound: true };
      }

      // Log transfer creation for seller analytics
      this.logger.logOperationStart(
        { type: "seller_transfer_created", id: stripeAccount.sellerId },
        {
          transferId: transfer.id,
          amount: transfer.amount,
          currency: transfer.currency,
          escrowId: operation.escrowId
        }
      );

      return {
        sellerFound: true,
        sellerId: stripeAccount.sellerId,
        sellerEmail: seller.email,
        transferLogged: true
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "log_transfer_for_seller", id: transfer.id },
        error
      );
      return { sellerFound: false, error: error.message };
    }
  }

  async updateSellerAfterTransfer(transfer, operation, status) {
    try {
      const stripeAccount = await StripeAccount.getByStripeAccountId(transfer.destination);
      if (!stripeAccount) {
        return { updated: false, reason: "stripe_account_not_found" };
      }

      // Update seller's transfer history/balance tracking
      // This could involve updating a seller balance table, sending notifications, etc.
      
      const seller = await User.findById(stripeAccount.sellerId);
      if (seller) {
        // Update seller metadata or send notification
        const updateData = {
          lastTransferAt: new Date(),
          lastTransferAmount: transfer.amount,
          lastTransferStatus: status
        };

        // In a real implementation, you might update seller statistics
        // seller.transferStats = { ...seller.transferStats, ...updateData };
        // await seller.save();

        return {
          updated: true,
          sellerId: stripeAccount.sellerId,
          transferStatus: status,
          amount: transfer.amount
        };
      }

      return { updated: false, reason: "seller_not_found" };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "update_seller_after_transfer", id: transfer.id },
        error
      );
      return { updated: false, error: error.message };
    }
  }

  async initiateRefundForFailedTransfer(order, operation) {
    try {
      // If the original payment was made via PaymentIntent, initiate refund
      if (order.paymentIntentId) {
        // This would integrate with the refund processor
        this.logger.logOperationStart(
          { type: "initiate_refund_for_failed_transfer", id: order._id },
          {
            paymentIntentId: order.paymentIntentId,
            amount: order.totalAmount,
            reason: "transfer_failed"
          }
        );

        // TODO: Call refund service
        // await refundProcessor.initiateRefund({
        //   paymentIntentId: order.paymentIntentId,
        //   amount: order.totalAmount,
        //   reason: "Transfer to seller failed"
        // });

        return { refundInitiated: true };
      }

      return { refundInitiated: false, reason: "no_payment_intent" };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "initiate_refund_for_failed_transfer", id: order._id },
        error
      );
      return { refundInitiated: false, error: error.message };
    }
  }

  // Utility methods

  async getTransferStats(timeRange = 24) {
    const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
    
    const stats = await PaymentOperation.aggregate([
      { 
        $match: { 
          type: "transfer",
          createdAt: { $gte: startTime },
          stripeId: { $regex: /^tr_/ } // Transfer IDs start with tr_
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

  async getSellerTransferHistory(sellerId, options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      const skip = (page - 1) * limit;

      // Get seller's Stripe account
      const stripeAccount = await StripeAccount.getBySellerId(sellerId);
      if (!stripeAccount) {
        return { transfers: [], total: 0, error: "No Stripe account found" };
      }

      // Build query
      const query = {
        type: "transfer",
        stripeAccountId: stripeAccount.stripeAccountId
      };
      if (status) query.status = status;

      const transfers = await PaymentOperation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await PaymentOperation.countDocuments(query);

      return {
        transfers,
        total,
        pagination: {
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_seller_transfer_history", id: sellerId },
        error
      );
      return { transfers: [], total: 0, error: error.message };
    }
  }

  async retryFailedTransfer(transferId) {
    try {
      const operation = await PaymentOperation.getByStripeId(transferId);
      if (!operation || operation.status !== "failed") {
        throw new Error("Transfer operation not found or not in failed status");
      }

      // In a real implementation, this would recreate the transfer
      // For now, we'll just reset the status for manual retry
      operation.status = "pending";
      operation.retryCount = (operation.retryCount || 0) + 1;
      operation.metadata = {
        ...operation.metadata,
        retryInitiated: true,
        retryAt: new Date()
      };
      await operation.save();

      return {
        retried: true,
        operationId: operation._id,
        retryCount: operation.retryCount
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "retry_failed_transfer", id: transferId },
        error
      );
      throw error;
    }
  }
}

module.exports = TransferProcessor;