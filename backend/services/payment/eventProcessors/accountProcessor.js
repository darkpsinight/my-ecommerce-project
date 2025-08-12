const PaymentLogger = require("../paymentLogger");
const { StripeAccount } = require("../../../models/stripeAccount");
const { User } = require("../../../models/user");
const { PaymentOperation } = require("../../../models/paymentOperation");

class AccountProcessor {
  constructor() {
    this.logger = new PaymentLogger();
  }

  async processAccountUpdated(event) {
    const account = event.data.object;
    const correlationId = this.logger.logOperationStart(
      { type: "process_account_updated", id: account.id },
      { 
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted
      }
    );

    try {
      // Get the account record from database
      const stripeAccount = await StripeAccount.getByStripeAccountId(account.id);
      if (!stripeAccount) {
        this.logger.logOperationFailure(
          { type: "process_account_updated", id: account.id },
          new Error("Stripe account not found in database"),
          correlationId
        );
        return { processed: false, reason: "account_not_found" };
      }

      // Store previous status for comparison
      const previousStatus = {
        status: stripeAccount.status,
        chargesEnabled: stripeAccount.chargesEnabled,
        payoutsEnabled: stripeAccount.payoutsEnabled,
        detailsSubmitted: stripeAccount.detailsSubmitted
      };

      // Update account with fresh Stripe data
      await stripeAccount.updateFromStripeAccount(account);

      // Determine what changed
      const changes = this.detectAccountChanges(previousStatus, stripeAccount);

      // Handle significant changes
      const result = await this.handleAccountChanges(stripeAccount, changes, account);

      this.logger.logOperationSuccess(
        { type: "process_account_updated", id: account.id },
        { changes, result },
        correlationId
      );

      return { processed: true, changes, result };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_account_updated", id: account.id },
        error,
        correlationId
      );
      throw error;
    }
  }

  async processAccountDeauthorized(event) {
    const account = event.data.object;
    const correlationId = this.logger.logOperationStart(
      { type: "process_account_deauthorized", id: account.id }
    );

    try {
      // Log security event
      this.logger.logSecurityEvent("account_deauthorized", {
        accountId: account.id,
        reason: "Application access revoked by account holder"
      });

      const stripeAccount = await StripeAccount.getByStripeAccountId(account.id);
      if (!stripeAccount) {
        return { processed: false, reason: "account_not_found" };
      }

      // Mark account as deauthorized
      const previousStatus = stripeAccount.status;
      stripeAccount.status = "restricted";
      stripeAccount.metadata = {
        ...stripeAccount.metadata,
        deauthorized: true,
        deauthorizedAt: new Date(),
        previousStatus
      };
      await stripeAccount.save();

      // Handle deauthorization consequences
      const result = await this.handleAccountDeauthorization(stripeAccount);

      this.logger.logOperationSuccess(
        { type: "process_account_deauthorized", id: account.id },
        result,
        correlationId
      );

      return { processed: true, result };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_account_deauthorized", id: account.id },
        error,
        correlationId
      );
      throw error;
    }
  }

  async processAccountApplicationAuthorized(event) {
    const account = event.data.object;
    
    try {
      // Handle account re-authorization (if previously deauthorized)
      const stripeAccount = await StripeAccount.getByStripeAccountId(account.id);
      if (!stripeAccount) {
        return { processed: false, reason: "account_not_found" };
      }

      // Remove deauthorization flags if present
      if (stripeAccount.metadata?.deauthorized) {
        stripeAccount.metadata = {
          ...stripeAccount.metadata,
          deauthorized: false,
          reauthorizedAt: new Date()
        };
        
        // Restore previous status if available
        if (stripeAccount.metadata.previousStatus) {
          stripeAccount.status = stripeAccount.metadata.previousStatus;
        }
        
        await stripeAccount.save();
      }

      return { 
        processed: true, 
        result: { 
          reauthorized: true,
          accountId: account.id 
        } 
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "process_account_authorized", id: account.id },
        error
      );
      throw error;
    }
  }

  // Private helper methods

  detectAccountChanges(previousStatus, currentAccount) {
    const changes = {
      statusChanged: previousStatus.status !== currentAccount.status,
      chargesEnabledChanged: previousStatus.chargesEnabled !== currentAccount.chargesEnabled,
      payoutsEnabledChanged: previousStatus.payoutsEnabled !== currentAccount.payoutsEnabled,
      detailsSubmittedChanged: previousStatus.detailsSubmitted !== currentAccount.detailsSubmitted,
      becameFullyVerified: false,
      becameRestricted: false
    };

    // Check for significant status changes
    changes.becameFullyVerified = !previousStatus.chargesEnabled && !previousStatus.payoutsEnabled &&
                                  currentAccount.chargesEnabled && currentAccount.payoutsEnabled;

    changes.becameRestricted = previousStatus.status !== "restricted" && 
                              currentAccount.status === "restricted";

    return changes;
  }

  async handleAccountChanges(stripeAccount, changes, stripeAccountData) {
    const results = [];

    try {
      // Handle verification completion
      if (changes.becameFullyVerified) {
        const verificationResult = await this.handleAccountVerificationComplete(stripeAccount);
        results.push({ type: "verification_complete", ...verificationResult });
      }

      // Handle account restriction
      if (changes.becameRestricted) {
        const restrictionResult = await this.handleAccountRestricted(stripeAccount, stripeAccountData);
        results.push({ type: "account_restricted", ...restrictionResult });
      }

      // Handle charges enabled
      if (changes.chargesEnabledChanged && stripeAccount.chargesEnabled) {
        const chargesResult = await this.handleChargesEnabled(stripeAccount);
        results.push({ type: "charges_enabled", ...chargesResult });
      }

      // Handle payouts enabled
      if (changes.payoutsEnabledChanged && stripeAccount.payoutsEnabled) {
        const payoutsResult = await this.handlePayoutsEnabled(stripeAccount);
        results.push({ type: "payouts_enabled", ...payoutsResult });
      }

      // Handle details submitted
      if (changes.detailsSubmittedChanged && stripeAccount.detailsSubmitted) {
        const detailsResult = await this.handleDetailsSubmitted(stripeAccount);
        results.push({ type: "details_submitted", ...detailsResult });
      }

      // Send notifications to seller
      if (results.length > 0) {
        await this.notifySellerOfAccountChanges(stripeAccount, changes, results);
      }

      return { handled: true, results };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "handle_account_changes", id: stripeAccount.stripeAccountId },
        error
      );
      return { handled: false, error: error.message, partialResults: results };
    }
  }

  async handleAccountVerificationComplete(stripeAccount) {
    try {
      // Mark account as migrated
      if (!stripeAccount.migrated) {
        stripeAccount.migrated = true;
        stripeAccount.migratedAt = new Date();
        await stripeAccount.save();
      }

      // Get seller information
      const seller = await User.findById(stripeAccount.sellerId);
      
      // Log successful verification
      this.logger.logOperationSuccess(
        { type: "account_verification_complete", id: stripeAccount.stripeAccountId },
        {
          sellerId: stripeAccount.sellerId,
          sellerEmail: seller?.email,
          capabilities: stripeAccount.capabilities,
          migratedAt: stripeAccount.migratedAt
        }
      );

      // Enable seller for transfers
      await this.enableSellerForTransfers(stripeAccount);

      return {
        verified: true,
        migrated: true,
        sellerId: stripeAccount.sellerId,
        transfersEnabled: true
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "handle_verification_complete", id: stripeAccount.stripeAccountId },
        error
      );
      return { verified: true, error: error.message };
    }
  }

  async handleAccountRestricted(stripeAccount, stripeAccountData) {
    try {
      // Log restriction details
      this.logger.logSecurityEvent("account_restricted", {
        accountId: stripeAccount.stripeAccountId,
        sellerId: stripeAccount.sellerId,
        requirements: stripeAccountData.requirements,
        restrictions: stripeAccountData.restrictions
      });

      // Disable transfers for this seller
      await this.disableSellerTransfers(stripeAccount);

      // Get pending transfers that need to be handled
      const pendingTransfers = await this.getPendingTransfersForAccount(stripeAccount.stripeAccountId);

      return {
        restricted: true,
        transfersDisabled: true,
        pendingTransfers: pendingTransfers.length,
        requirements: stripeAccountData.requirements
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "handle_account_restricted", id: stripeAccount.stripeAccountId },
        error
      );
      return { restricted: true, error: error.message };
    }
  }

  async handleChargesEnabled(stripeAccount) {
    try {
      // Log charges enabled
      this.logger.logOperationSuccess(
        { type: "charges_enabled", id: stripeAccount.stripeAccountId },
        { sellerId: stripeAccount.sellerId }
      );

      return { chargesEnabled: true };

    } catch (error) {
      return { chargesEnabled: true, error: error.message };
    }
  }

  async handlePayoutsEnabled(stripeAccount) {
    try {
      // Log payouts enabled
      this.logger.logOperationSuccess(
        { type: "payouts_enabled", id: stripeAccount.stripeAccountId },
        { sellerId: stripeAccount.sellerId }
      );

      // Check if account is now fully ready for transfers
      if (stripeAccount.chargesEnabled && stripeAccount.payoutsEnabled) {
        await this.enableSellerForTransfers(stripeAccount);
        return { payoutsEnabled: true, transfersEnabled: true };
      }

      return { payoutsEnabled: true };

    } catch (error) {
      return { payoutsEnabled: true, error: error.message };
    }
  }

  async handleDetailsSubmitted(stripeAccount) {
    try {
      // Log details submission
      this.logger.logOperationSuccess(
        { type: "details_submitted", id: stripeAccount.stripeAccountId },
        { sellerId: stripeAccount.sellerId }
      );

      return { detailsSubmitted: true };

    } catch (error) {
      return { detailsSubmitted: true, error: error.message };
    }
  }

  async handleAccountDeauthorization(stripeAccount) {
    try {
      // Disable all transfers for this account
      await this.disableSellerTransfers(stripeAccount);

      // Get pending operations that need to be handled
      const pendingOperations = await this.getPendingOperationsForAccount(stripeAccount.stripeAccountId);

      // Cancel pending transfers
      const cancelResults = await this.cancelPendingTransfers(pendingOperations);

      // Notify admins of deauthorization
      await this.notifyAdminsOfDeauthorization(stripeAccount);

      return {
        deauthorized: true,
        transfersDisabled: true,
        pendingOperations: pendingOperations.length,
        canceledTransfers: cancelResults.canceled,
        adminNotified: true
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "handle_account_deauthorization", id: stripeAccount.stripeAccountId },
        error
      );
      return { deauthorized: true, error: error.message };
    }
  }

  async enableSellerForTransfers(stripeAccount) {
    try {
      // Update seller record to indicate transfer readiness
      const seller = await User.findById(stripeAccount.sellerId);
      if (seller) {
        seller.stripeTransfersEnabled = true;
        seller.stripeVerifiedAt = new Date();
        await seller.save();
      }

      return { enabled: true };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "enable_seller_transfers", id: stripeAccount.sellerId },
        error
      );
      return { enabled: false, error: error.message };
    }
  }

  async disableSellerTransfers(stripeAccount) {
    try {
      // Update seller record to disable transfers
      const seller = await User.findById(stripeAccount.sellerId);
      if (seller) {
        seller.stripeTransfersEnabled = false;
        seller.stripeDisabledAt = new Date();
        await seller.save();
      }

      return { disabled: true };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "disable_seller_transfers", id: stripeAccount.sellerId },
        error
      );
      return { disabled: false, error: error.message };
    }
  }

  async getPendingTransfersForAccount(stripeAccountId) {
    try {
      return await PaymentOperation.find({
        type: "transfer",
        stripeAccountId,
        status: { $in: ["pending", "requires_action"] }
      }).lean();

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_pending_transfers", id: stripeAccountId },
        error
      );
      return [];
    }
  }

  async getPendingOperationsForAccount(stripeAccountId) {
    try {
      return await PaymentOperation.find({
        stripeAccountId,
        status: { $in: ["pending", "requires_action"] }
      }).lean();

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_pending_operations", id: stripeAccountId },
        error
      );
      return [];
    }
  }

  async cancelPendingTransfers(pendingOperations) {
    let canceled = 0;
    let errors = 0;

    for (const operation of pendingOperations) {
      try {
        if (operation.type === "transfer") {
          const op = await PaymentOperation.findById(operation._id);
          if (op) {
            await op.markAsCanceled();
            canceled++;
          }
        }
      } catch (error) {
        errors++;
        this.logger.logOperationFailure(
          { type: "cancel_pending_transfer", id: operation._id },
          error
        );
      }
    }

    return { canceled, errors, total: pendingOperations.length };
  }

  async notifySellerOfAccountChanges(stripeAccount, changes, results) {
    try {
      const seller = await User.findById(stripeAccount.sellerId);
      if (!seller) return;

      // In a real implementation, this would send email notifications
      this.logger.logOperationSuccess(
        { type: "seller_notification", id: stripeAccount.sellerId },
        {
          sellerEmail: seller.email,
          changes,
          results,
          accountStatus: stripeAccount.status
        }
      );

      // TODO: Implement actual notification sending
      // await emailService.sendAccountUpdateNotification(seller.email, changes, results);

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "notify_seller_changes", id: stripeAccount.sellerId },
        error
      );
    }
  }

  async notifyAdminsOfDeauthorization(stripeAccount) {
    try {
      // In a real implementation, this would notify admins
      this.logger.logSecurityEvent("admin_notification_deauth", {
        accountId: stripeAccount.stripeAccountId,
        sellerId: stripeAccount.sellerId,
        deauthorizedAt: new Date()
      });

      // TODO: Implement admin notification
      // await adminNotificationService.notifyDeauthorization(stripeAccount);

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "notify_admins_deauth", id: stripeAccount.stripeAccountId },
        error
      );
    }
  }

  // Utility methods

  async getAccountStats(timeRange = 24) {
    const startTime = new Date(Date.now() - timeRange * 60 * 60 * 1000);
    
    const stats = await StripeAccount.aggregate([
      { $match: { updatedAt: { $gte: startTime } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          chargesEnabled: { $sum: { $cond: ["$chargesEnabled", 1, 0] } },
          payoutsEnabled: { $sum: { $cond: ["$payoutsEnabled", 1, 0] } },
          fullyVerified: { 
            $sum: { 
              $cond: [
                { $and: ["$chargesEnabled", "$payoutsEnabled", "$detailsSubmitted"] }, 
                1, 
                0
              ] 
            } 
          }
        }
      }
    ]);

    return stats;
  }

  async getAccountRequirements(stripeAccountId) {
    try {
      const stripeAccount = await StripeAccount.getByStripeAccountId(stripeAccountId);
      if (!stripeAccount) {
        return { found: false };
      }

      return {
        found: true,
        requirements: {
          currentlyDue: stripeAccount.currentlyDue,
          eventuallyDue: stripeAccount.eventuallyDue,
          pastDue: stripeAccount.pastDue,
          pendingVerification: stripeAccount.pendingVerification
        },
        status: stripeAccount.status,
        capabilities: stripeAccount.capabilities
      };

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "get_account_requirements", id: stripeAccountId },
        error
      );
      return { found: false, error: error.message };
    }
  }
}

module.exports = AccountProcessor;