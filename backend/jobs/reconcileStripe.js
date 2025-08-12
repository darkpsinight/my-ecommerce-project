const StripeAdapter = require("../services/payment/stripeAdapter");
const PaymentLogger = require("../services/payment/paymentLogger");
const { PaymentOperation } = require("../models/paymentOperation");
const { StripeAccount } = require("../models/stripeAccount");
const { LegacyWallet } = require("../models/legacyWallet");
const { WebhookEvent } = require("../models/webhookEvent");
const { PaymentErrorHandler } = require("../services/payment/paymentErrors");
const { configs } = require("../configs");

class StripeReconciliationService {
  constructor() {
    this.stripeAdapter = new StripeAdapter();
    this.logger = new PaymentLogger();
    this.reconciliationResults = {
      payments: { checked: 0, discrepancies: 0, errors: 0 },
      transfers: { checked: 0, discrepancies: 0, errors: 0 },
      accounts: { checked: 0, discrepancies: 0, errors: 0 },
      balances: { checked: 0, discrepancies: 0, errors: 0 },
      webhooks: { checked: 0, discrepancies: 0, errors: 0 }
    };
  }

  async runFullReconciliation(options = {}) {
    const {
      timeRange = 24, // hours
      batchSize = 100,
      includeBalances = true,
      includeWebhooks = true,
      dryRun = false
    } = options;

    const correlationId = this.logger.logReconciliationStart("full_reconciliation", {
      timeRange,
      batchSize,
      includeBalances,
      includeWebhooks,
      dryRun
    });

    try {
      const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
      
      // Reset results
      this.resetReconciliationResults();

      // Run all reconciliation checks
      await this.reconcilePaymentOperations(startTime, batchSize, dryRun);
      await this.reconcileTransferOperations(startTime, batchSize, dryRun);
      await this.reconcileStripeAccounts(batchSize, dryRun);
      
      if (includeBalances) {
        await this.reconcilePlatformBalance(dryRun);
        await this.reconcileLegacyWalletBalances(dryRun);
      }
      
      if (includeWebhooks) {
        await this.reconcileWebhookEvents(startTime, batchSize, dryRun);
      }

      // Generate summary report
      const summary = this.generateReconciliationSummary();

      this.logger.logReconciliationComplete("full_reconciliation", {
        ...summary,
        timeRange,
        dryRun
      });

      return {
        success: true,
        summary,
        correlationId,
        dryRun
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "full_reconciliation" },
        error,
        correlationId
      );
      throw error;
    }
  }

  async reconcilePaymentOperations(startTime, batchSize = 100, dryRun = false) {
    try {
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        // Get payment operations from database
        const operations = await PaymentOperation.find({
          type: "charge",
          createdAt: { $gte: startTime },
          stripeId: { $regex: /^pi_/ } // Payment Intent IDs
        })
        .skip(offset)
        .limit(batchSize)
        .lean();

        if (operations.length === 0) {
          hasMore = false;
          continue;
        }

        // Check each operation against Stripe
        for (const operation of operations) {
          await this.reconcilePaymentOperation(operation, dryRun);
        }

        offset += batchSize;
        hasMore = operations.length === batchSize;
      }

    } catch (error) {
      this.reconciliationResults.payments.errors++;
      this.logger.logOperationFailure(
        { type: "reconcile_payment_operations" },
        error
      );
      throw error;
    }
  }

  async reconcilePaymentOperation(operation, dryRun = false) {
    try {
      this.reconciliationResults.payments.checked++;

      // Get payment intent from Stripe
      const stripe = this.stripeAdapter.getStripe();
      const paymentIntent = await stripe.paymentIntents.retrieve(operation.stripeId);

      // Check for discrepancies
      const discrepancies = [];

      // Amount check
      if (operation.amountCents !== paymentIntent.amount) {
        discrepancies.push({
          field: "amount",
          database: operation.amountCents,
          stripe: paymentIntent.amount
        });
      }

      // Currency check
      if (operation.currency.toLowerCase() !== paymentIntent.currency) {
        discrepancies.push({
          field: "currency",
          database: operation.currency,
          stripe: paymentIntent.currency
        });
      }

      // Status check
      const expectedStatus = this.mapStripeStatusToOperationStatus(paymentIntent.status);
      if (operation.status !== expectedStatus) {
        discrepancies.push({
          field: "status",
          database: operation.status,
          stripe: paymentIntent.status,
          expected: expectedStatus
        });
      }

      if (discrepancies.length > 0) {
        this.reconciliationResults.payments.discrepancies++;
        
        this.logger.logDiscrepancy("payment_operation", {
          operationId: operation._id,
          stripeId: operation.stripeId,
          discrepancies
        });

        if (!dryRun) {
          await this.fixPaymentOperationDiscrepancies(operation, paymentIntent, discrepancies);
        }
      }

    } catch (error) {
      this.reconciliationResults.payments.errors++;
      this.logger.logOperationFailure(
        { type: "reconcile_payment_operation", id: operation.stripeId },
        error
      );
    }
  }

  async reconcileTransferOperations(startTime, batchSize = 100, dryRun = false) {
    try {
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const operations = await PaymentOperation.find({
          type: "transfer",
          createdAt: { $gte: startTime },
          stripeId: { $regex: /^tr_/ } // Transfer IDs
        })
        .skip(offset)
        .limit(batchSize)
        .lean();

        if (operations.length === 0) {
          hasMore = false;
          continue;
        }

        for (const operation of operations) {
          await this.reconcileTransferOperation(operation, dryRun);
        }

        offset += batchSize;
        hasMore = operations.length === batchSize;
      }

    } catch (error) {
      this.reconciliationResults.transfers.errors++;
      this.logger.logOperationFailure(
        { type: "reconcile_transfer_operations" },
        error
      );
      throw error;
    }
  }

  async reconcileTransferOperation(operation, dryRun = false) {
    try {
      this.reconciliationResults.transfers.checked++;

      // Get transfer from Stripe
      const stripe = this.stripeAdapter.getStripe();
      const transfer = await stripe.transfers.retrieve(operation.stripeId);

      const discrepancies = [];

      // Amount check
      if (operation.amountCents !== transfer.amount) {
        discrepancies.push({
          field: "amount",
          database: operation.amountCents,
          stripe: transfer.amount
        });
      }

      // Destination check
      if (operation.stripeAccountId !== transfer.destination) {
        discrepancies.push({
          field: "destination",
          database: operation.stripeAccountId,
          stripe: transfer.destination
        });
      }

      // Status check
      const expectedStatus = this.mapStripeTransferStatusToOperationStatus(transfer.status);
      if (operation.status !== expectedStatus) {
        discrepancies.push({
          field: "status",
          database: operation.status,
          stripe: transfer.status,
          expected: expectedStatus
        });
      }

      if (discrepancies.length > 0) {
        this.reconciliationResults.transfers.discrepancies++;
        
        this.logger.logDiscrepancy("transfer_operation", {
          operationId: operation._id,
          stripeId: operation.stripeId,
          discrepancies
        });

        if (!dryRun) {
          await this.fixTransferOperationDiscrepancies(operation, transfer, discrepancies);
        }
      }

    } catch (error) {
      this.reconciliationResults.transfers.errors++;
      this.logger.logOperationFailure(
        { type: "reconcile_transfer_operation", id: operation.stripeId },
        error
      );
    }
  }

  async reconcileStripeAccounts(batchSize = 50, dryRun = false) {
    try {
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const accounts = await StripeAccount.find({})
          .skip(offset)
          .limit(batchSize)
          .lean();

        if (accounts.length === 0) {
          hasMore = false;
          continue;
        }

        for (const account of accounts) {
          await this.reconcileStripeAccount(account, dryRun);
        }

        offset += batchSize;
        hasMore = accounts.length === batchSize;
      }

    } catch (error) {
      this.reconciliationResults.accounts.errors++;
      this.logger.logOperationFailure(
        { type: "reconcile_stripe_accounts" },
        error
      );
      throw error;
    }
  }

  async reconcileStripeAccount(account, dryRun = false) {
    try {
      this.reconciliationResults.accounts.checked++;

      // Get account from Stripe
      const stripe = this.stripeAdapter.getStripe();
      const stripeAccount = await stripe.accounts.retrieve(account.stripeAccountId);

      const discrepancies = [];

      // Status checks
      if (account.chargesEnabled !== stripeAccount.charges_enabled) {
        discrepancies.push({
          field: "chargesEnabled",
          database: account.chargesEnabled,
          stripe: stripeAccount.charges_enabled
        });
      }

      if (account.payoutsEnabled !== stripeAccount.payouts_enabled) {
        discrepancies.push({
          field: "payoutsEnabled",
          database: account.payoutsEnabled,
          stripe: stripeAccount.payouts_enabled
        });
      }

      if (account.detailsSubmitted !== stripeAccount.details_submitted) {
        discrepancies.push({
          field: "detailsSubmitted",
          database: account.detailsSubmitted,
          stripe: stripeAccount.details_submitted
        });
      }

      // Requirements check
      const currentlyDue = stripeAccount.requirements?.currently_due || [];
      if (JSON.stringify(account.currentlyDue.sort()) !== JSON.stringify(currentlyDue.sort())) {
        discrepancies.push({
          field: "currentlyDue",
          database: account.currentlyDue,
          stripe: currentlyDue
        });
      }

      if (discrepancies.length > 0) {
        this.reconciliationResults.accounts.discrepancies++;
        
        this.logger.logDiscrepancy("stripe_account", {
          accountId: account._id,
          stripeAccountId: account.stripeAccountId,
          discrepancies
        });

        if (!dryRun) {
          await this.fixStripeAccountDiscrepancies(account, stripeAccount, discrepancies);
        }
      }

    } catch (error) {
      this.reconciliationResults.accounts.errors++;
      this.logger.logOperationFailure(
        { type: "reconcile_stripe_account", id: account.stripeAccountId },
        error
      );
    }
  }

  async reconcilePlatformBalance(dryRun = false) {
    try {
      this.reconciliationResults.balances.checked++;

      // Get platform balance from Stripe
      const stripe = this.stripeAdapter.getStripe();
      const balance = await stripe.balance.retrieve();

      // Calculate expected balance from database
      const expectedBalance = await this.calculateExpectedPlatformBalance();

      // Check available balance (in cents)
      const stripeAvailable = balance.available.reduce((sum, bal) => 
        bal.currency === 'usd' ? sum + bal.amount : sum, 0);

      const discrepancy = Math.abs(expectedBalance.availableCents - stripeAvailable);
      const toleranceCents = 100; // $1.00 tolerance for rounding/timing differences

      if (discrepancy > toleranceCents) {
        this.reconciliationResults.balances.discrepancies++;
        
        this.logger.logDiscrepancy("platform_balance", {
          stripeAvailable,
          databaseExpected: expectedBalance.availableCents,
          discrepancy,
          tolerance: toleranceCents,
          breakdown: expectedBalance.breakdown
        });

        if (!dryRun) {
          // Platform balance discrepancies usually require manual investigation
          await this.flagPlatformBalanceDiscrepancy(stripeAvailable, expectedBalance);
        }
      }

    } catch (error) {
      this.reconciliationResults.balances.errors++;
      this.logger.logOperationFailure(
        { type: "reconcile_platform_balance" },
        error
      );
    }
  }

  async reconcileLegacyWalletBalances(dryRun = false) {
    try {
      // Get total legacy wallet balances
      const totalLegacyBalance = await LegacyWallet.getTotalLegacyBalance();
      
      // In development, we should have equivalent reserves in platform account
      // This is a simplified check - in production you'd have more complex logic
      
      this.reconciliationResults.balances.checked++;

      this.logger.logOperationSuccess(
        { type: "legacy_wallet_balance_check" },
        {
          totalLegacyBalanceCents: totalLegacyBalance,
          message: "Legacy wallet balance recorded for monitoring"
        }
      );

    } catch (error) {
      this.reconciliationResults.balances.errors++;
      this.logger.logOperationFailure(
        { type: "reconcile_legacy_wallet_balances" },
        error
      );
    }
  }

  async reconcileWebhookEvents(startTime, batchSize = 100, dryRun = false) {
    try {
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const webhookEvents = await WebhookEvent.find({
          createdAt: { $gte: startTime },
          processed: false,
          processingAttempts: { $gt: 0 }
        })
        .skip(offset)
        .limit(batchSize)
        .lean();

        if (webhookEvents.length === 0) {
          hasMore = false;
          continue;
        }

        for (const webhookEvent of webhookEvents) {
          await this.reconcileWebhookEvent(webhookEvent, dryRun);
        }

        offset += batchSize;
        hasMore = webhookEvents.length === batchSize;
      }

    } catch (error) {
      this.reconciliationResults.webhooks.errors++;
      this.logger.logOperationFailure(
        { type: "reconcile_webhook_events" },
        error
      );
    }
  }

  async reconcileWebhookEvent(webhookEvent, dryRun = false) {
    try {
      this.reconciliationResults.webhooks.checked++;

      // Check if the webhook event should be retried
      if (webhookEvent.shouldRetryProcessing()) {
        this.reconciliationResults.webhooks.discrepancies++;
        
        this.logger.logDiscrepancy("webhook_event", {
          eventId: webhookEvent._id,
          stripeEventId: webhookEvent.stripeEventId,
          type: webhookEvent.type,
          processingAttempts: webhookEvent.processingAttempts,
          reason: "failed_webhook_ready_for_retry"
        });

        if (!dryRun) {
          // Retry the webhook processing
          const webhookProcessor = require("../services/payment/webhookProcessor");
          const processor = new webhookProcessor();
          await processor.processEvent(webhookEvent);
        }
      }

    } catch (error) {
      this.reconciliationResults.webhooks.errors++;
      this.logger.logOperationFailure(
        { type: "reconcile_webhook_event", id: webhookEvent.stripeEventId },
        error
      );
    }
  }

  // Helper methods for fixing discrepancies

  async fixPaymentOperationDiscrepancies(operation, paymentIntent, discrepancies) {
    try {
      const updates = {};

      for (const discrepancy of discrepancies) {
        switch (discrepancy.field) {
          case "amount":
            updates.amountCents = paymentIntent.amount;
            break;
          case "currency":
            updates.currency = paymentIntent.currency.toUpperCase();
            break;
          case "status":
            updates.status = discrepancy.expected;
            if (discrepancy.expected === "succeeded") {
              updates.processedAt = new Date();
            } else if (discrepancy.expected === "failed") {
              updates.failedAt = new Date();
            }
            break;
        }
      }

      if (Object.keys(updates).length > 0) {
        await PaymentOperation.findByIdAndUpdate(operation._id, updates);
        
        this.logger.logOperationSuccess(
          { type: "fix_payment_operation_discrepancies", id: operation.stripeId },
          { updates }
        );
      }

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "fix_payment_operation_discrepancies", id: operation.stripeId },
        error
      );
    }
  }

  async fixTransferOperationDiscrepancies(operation, transfer, discrepancies) {
    try {
      const updates = {};

      for (const discrepancy of discrepancies) {
        switch (discrepancy.field) {
          case "amount":
            updates.amountCents = transfer.amount;
            break;
          case "destination":
            updates.stripeAccountId = transfer.destination;
            break;
          case "status":
            updates.status = discrepancy.expected;
            if (discrepancy.expected === "succeeded") {
              updates.processedAt = new Date();
            } else if (discrepancy.expected === "failed") {
              updates.failedAt = new Date();
            }
            break;
        }
      }

      if (Object.keys(updates).length > 0) {
        await PaymentOperation.findByIdAndUpdate(operation._id, updates);
        
        this.logger.logOperationSuccess(
          { type: "fix_transfer_operation_discrepancies", id: operation.stripeId },
          { updates }
        );
      }

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "fix_transfer_operation_discrepancies", id: operation.stripeId },
        error
      );
    }
  }

  async fixStripeAccountDiscrepancies(account, stripeAccount, discrepancies) {
    try {
      // Use the existing updateFromStripeAccount method
      const dbAccount = await StripeAccount.findById(account._id);
      if (dbAccount) {
        await dbAccount.updateFromStripeAccount(stripeAccount);
        
        this.logger.logOperationSuccess(
          { type: "fix_stripe_account_discrepancies", id: account.stripeAccountId },
          { discrepancies: discrepancies.length }
        );
      }

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "fix_stripe_account_discrepancies", id: account.stripeAccountId },
        error
      );
    }
  }

  async flagPlatformBalanceDiscrepancy(stripeBalance, expectedBalance) {
    try {
      // In a real system, this would create an alert or ticket for manual review
      this.logger.logSecurityEvent("platform_balance_discrepancy", {
        stripeBalance,
        expectedBalance: expectedBalance.availableCents,
        discrepancy: Math.abs(stripeBalance - expectedBalance.availableCents),
        requiresInvestigation: true
      });

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "flag_platform_balance_discrepancy" },
        error
      );
    }
  }

  // Utility methods

  async calculateExpectedPlatformBalance() {
    try {
      // Calculate expected platform balance based on database records
      const results = await PaymentOperation.aggregate([
        {
          $match: {
            status: "succeeded"
          }
        },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amountCents" },
            count: { $sum: 1 }
          }
        }
      ]);

      let expectedBalance = 0;
      const breakdown = {};

      for (const result of results) {
        breakdown[result._id] = {
          amount: result.totalAmount,
          count: result.count
        };

        if (result._id === "charge") {
          expectedBalance += result.totalAmount; // Money coming in
        } else if (result._id === "transfer") {
          expectedBalance -= result.totalAmount; // Money going out
        } else if (result._id === "refund") {
          expectedBalance -= result.totalAmount; // Money going out
        }
      }

      return {
        availableCents: expectedBalance,
        breakdown
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "calculate_expected_platform_balance" },
        error
      );
      return { availableCents: 0, breakdown: {}, error: error.message };
    }
  }

  mapStripeStatusToOperationStatus(stripeStatus) {
    const statusMap = {
      "succeeded": "succeeded",
      "requires_payment_method": "pending",
      "requires_confirmation": "pending",
      "requires_action": "requires_action",
      "processing": "pending",
      "requires_capture": "pending",
      "canceled": "canceled",
      "failed": "failed"
    };

    return statusMap[stripeStatus] || "pending";
  }

  mapStripeTransferStatusToOperationStatus(stripeStatus) {
    const statusMap = {
      "paid": "succeeded",
      "pending": "pending",
      "in_transit": "pending",
      "canceled": "canceled",
      "failed": "failed"
    };

    return statusMap[stripeStatus] || "pending";
  }

  resetReconciliationResults() {
    this.reconciliationResults = {
      payments: { checked: 0, discrepancies: 0, errors: 0 },
      transfers: { checked: 0, discrepancies: 0, errors: 0 },
      accounts: { checked: 0, discrepancies: 0, errors: 0 },
      balances: { checked: 0, discrepancies: 0, errors: 0 },
      webhooks: { checked: 0, discrepancies: 0, errors: 0 }
    };
  }

  generateReconciliationSummary() {
    const totalChecked = Object.values(this.reconciliationResults)
      .reduce((sum, category) => sum + category.checked, 0);
    
    const totalDiscrepancies = Object.values(this.reconciliationResults)
      .reduce((sum, category) => sum + category.discrepancies, 0);
    
    const totalErrors = Object.values(this.reconciliationResults)
      .reduce((sum, category) => sum + category.errors, 0);

    const successRate = totalChecked > 0 ? 
      ((totalChecked - totalDiscrepancies - totalErrors) / totalChecked) * 100 : 100;

    return {
      totalChecked,
      totalDiscrepancies,
      totalErrors,
      successRate: Math.round(successRate * 100) / 100,
      details: this.reconciliationResults,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = StripeReconciliationService;