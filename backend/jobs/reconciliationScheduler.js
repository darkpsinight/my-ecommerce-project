const cron = require("node-cron");
const StripeReconciliationService = require("./reconcileStripe");
const { assertCronEnabled } = require("../utils/cronGuard");
const PaymentLogger = require("../services/payment/paymentLogger");
const { configs } = require("../configs");

class ReconciliationScheduler {
  constructor() {
    this.reconciliationService = new StripeReconciliationService();
    this.logger = new PaymentLogger();
    this.jobs = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log("Reconciliation scheduler is already running");
      return;
    }

    this.isRunning = true;
    console.log("Starting Stripe reconciliation scheduler...");

    // Schedule different types of reconciliation
    this.scheduleHourlyReconciliation();
    this.scheduleDailyReconciliation();
    this.scheduleWeeklyReconciliation();
    this.scheduleWebhookReconciliation();

    console.log("Reconciliation scheduler started successfully");
  }

  stop() {
    if (!this.isRunning) {
      console.log("Reconciliation scheduler is not running");
      return;
    }

    // Stop all cron jobs
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Stopped reconciliation job: ${name}`);
    }

    this.jobs.clear();
    this.isRunning = false;
    console.log("Reconciliation scheduler stopped");
  }

  scheduleHourlyReconciliation() {
    // Run every hour at minute 15 (e.g., 1:15, 2:15, etc.)
    const job = cron.schedule(configs.STRIPE_RECONCILE_CRON_HOURLY, async () => {
      if (!assertCronEnabled("STRIPE_RECONCILIATION_HOURLY")) return;
      await this.runHourlyReconciliation();
    }, {
      scheduled: false,
      timezone: "UTC"
    });

    this.jobs.set("hourly", job);
    job.start();
    console.log("Scheduled hourly reconciliation (every hour at :15)");
  }

  scheduleDailyReconciliation() {
    // Run daily at 2:30 AM UTC
    const job = cron.schedule(configs.STRIPE_RECONCILE_CRON_DAILY, async () => {
      if (!assertCronEnabled("STRIPE_RECONCILIATION_DAILY")) return;
      await this.runDailyReconciliation();
    }, {
      scheduled: false,
      timezone: "UTC"
    });

    this.jobs.set("daily", job);
    job.start();
    console.log("Scheduled daily reconciliation (2:30 AM UTC)");
  }

  scheduleWeeklyReconciliation() {
    // Run weekly on Sunday at 3:00 AM UTC
    const job = cron.schedule("0 3 * * 0", async () => {
      if (!assertCronEnabled("STRIPE_RECONCILIATION_WEEKLY")) return;
      await this.runWeeklyReconciliation();
    }, {
      scheduled: false,
      timezone: "UTC"
    });

    this.jobs.set("weekly", job);
    job.start();
    console.log("Scheduled weekly reconciliation (Sunday 3:00 AM UTC)");
  }

  scheduleWebhookReconciliation() {
    // Run webhook reconciliation every 30 minutes
    const job = cron.schedule(configs.STRIPE_RECONCILE_CRON_WEBHOOK, async () => {
      if (!assertCronEnabled("STRIPE_RECONCILIATION_WEBHOOK")) return;
      await this.runWebhookReconciliation();
    }, {
      scheduled: false,
      timezone: "UTC"
    });

    this.jobs.set("webhook", job);
    job.start();
    console.log("Scheduled webhook reconciliation (every 30 minutes)");
  }

  async runHourlyReconciliation() {
    try {
      console.log("Starting hourly reconciliation...");

      const result = await this.reconciliationService.runFullReconciliation({
        timeRange: 2, // Last 2 hours
        batchSize: 50,
        includeBalances: false, // Skip balance checks for hourly
        includeWebhooks: false, // Handled separately
        dryRun: false
      });

      console.log("Hourly reconciliation completed:", result.summary);

      // Alert if high discrepancy rate
      if (result.summary.successRate < 95) {
        await this.alertHighDiscrepancyRate("hourly", result.summary);
      }

    } catch (error) {
      console.error("Hourly reconciliation failed:", error);
      this.logger.logOperationFailure(
        { type: "hourly_reconciliation_scheduled" },
        error
      );
    }
  }

  async runDailyReconciliation() {
    try {
      console.log("Starting daily reconciliation...");

      const result = await this.reconciliationService.runFullReconciliation({
        timeRange: 25, // Last 25 hours (overlap for safety)
        batchSize: 100,
        includeBalances: true,
        includeWebhooks: true,
        dryRun: false
      });

      console.log("Daily reconciliation completed:", result.summary);

      // Generate daily report
      await this.generateDailyReconciliationReport(result);

      // Alert if significant issues
      if (result.summary.totalDiscrepancies > 10 || result.summary.successRate < 90) {
        await this.alertSignificantIssues("daily", result.summary);
      }

    } catch (error) {
      console.error("Daily reconciliation failed:", error);
      this.logger.logOperationFailure(
        { type: "daily_reconciliation_scheduled" },
        error
      );
    }
  }

  async runWeeklyReconciliation() {
    try {
      console.log("Starting weekly reconciliation...");

      const result = await this.reconciliationService.runFullReconciliation({
        timeRange: 168, // Last 7 days
        batchSize: 200,
        includeBalances: true,
        includeWebhooks: true,
        dryRun: false
      });

      console.log("Weekly reconciliation completed:", result.summary);

      // Generate comprehensive weekly report
      await this.generateWeeklyReconciliationReport(result);

      // Always alert for weekly summary
      await this.sendWeeklySummary(result.summary);

    } catch (error) {
      console.error("Weekly reconciliation failed:", error);
      this.logger.logOperationFailure(
        { type: "weekly_reconciliation_scheduled" },
        error
      );
    }
  }

  async runWebhookReconciliation() {
    try {
      console.log("Starting webhook reconciliation...");

      const result = await this.reconciliationService.runFullReconciliation({
        timeRange: 1, // Last hour
        batchSize: 100,
        includeBalances: false,
        includeWebhooks: true, // Only webhooks
        dryRun: false
      });

      // Only log if there were issues
      if (result.summary.totalDiscrepancies > 0 || result.summary.totalErrors > 0) {
        console.log("Webhook reconciliation found issues:", result.summary);
      }

    } catch (error) {
      console.error("Webhook reconciliation failed:", error);
      this.logger.logOperationFailure(
        { type: "webhook_reconciliation_scheduled" },
        error
      );
    }
  }

  // Manual reconciliation methods

  async runManualReconciliation(options = {}) {
    try {
      console.log("Starting manual reconciliation with options:", options);

      const result = await this.reconciliationService.runFullReconciliation({
        timeRange: options.timeRange || 24,
        batchSize: options.batchSize || 100,
        includeBalances: options.includeBalances !== false,
        includeWebhooks: options.includeWebhooks !== false,
        dryRun: options.dryRun || false
      });

      console.log("Manual reconciliation completed:", result.summary);
      return result;

    } catch (error) {
      console.error("Manual reconciliation failed:", error);
      this.logger.logOperationFailure(
        { type: "manual_reconciliation" },
        error
      );
      throw error;
    }
  }

  async runDryRunReconciliation(timeRange = 24) {
    try {
      console.log(`Starting dry-run reconciliation for last ${timeRange} hours...`);

      const result = await this.reconciliationService.runFullReconciliation({
        timeRange,
        batchSize: 100,
        includeBalances: true,
        includeWebhooks: true,
        dryRun: true
      });

      console.log("Dry-run reconciliation completed:", result.summary);
      return result;

    } catch (error) {
      console.error("Dry-run reconciliation failed:", error);
      throw error;
    }
  }

  // Reporting and alerting methods

  async generateDailyReconciliationReport(result) {
    try {
      const report = {
        date: new Date().toISOString().split('T')[0],
        summary: result.summary,
        recommendations: this.generateRecommendations(result.summary),
        timestamp: new Date().toISOString()
      };

      this.logger.logOperationSuccess(
        { type: "daily_reconciliation_report" },
        report
      );

      // In a real system, this would save to a reports collection or send via email
      console.log("Daily reconciliation report generated:", report);

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "generate_daily_report" },
        error
      );
    }
  }

  async generateWeeklyReconciliationReport(result) {
    try {
      const report = {
        week: this.getWeekIdentifier(),
        summary: result.summary,
        trends: await this.calculateReconciliationTrends(),
        recommendations: this.generateRecommendations(result.summary),
        timestamp: new Date().toISOString()
      };

      this.logger.logOperationSuccess(
        { type: "weekly_reconciliation_report" },
        report
      );

      console.log("Weekly reconciliation report generated:", report);

    } catch (error) {
      this.logger.logOperationFailure(
        { type: "generate_weekly_report" },
        error
      );
    }
  }

  async alertHighDiscrepancyRate(frequency, summary) {
    try {
      this.logger.logSecurityEvent("high_discrepancy_rate", {
        frequency,
        successRate: summary.successRate,
        totalDiscrepancies: summary.totalDiscrepancies,
        totalChecked: summary.totalChecked,
        threshold: frequency === "hourly" ? 95 : 90
      });

      // In a real system, this would send alerts to admins
      console.warn(`HIGH DISCREPANCY RATE ALERT (${frequency}):`, summary);

    } catch (error) {
      console.error("Failed to send high discrepancy rate alert:", error);
    }
  }

  async alertSignificantIssues(frequency, summary) {
    try {
      this.logger.logSecurityEvent("significant_reconciliation_issues", {
        frequency,
        summary,
        requiresAttention: true
      });

      console.error(`SIGNIFICANT RECONCILIATION ISSUES (${frequency}):`, summary);

    } catch (error) {
      console.error("Failed to send significant issues alert:", error);
    }
  }

  async sendWeeklySummary(summary) {
    try {
      this.logger.logOperationSuccess(
        { type: "weekly_reconciliation_summary" },
        {
          summary,
          week: this.getWeekIdentifier(),
          status: summary.successRate >= 95 ? "healthy" :
            summary.successRate >= 90 ? "warning" : "critical"
        }
      );

      console.log("Weekly reconciliation summary:", summary);

    } catch (error) {
      console.error("Failed to send weekly summary:", error);
    }
  }

  // Utility methods

  generateRecommendations(summary) {
    const recommendations = [];

    if (summary.successRate < 90) {
      recommendations.push("Critical: Success rate below 90%. Immediate investigation required.");
    } else if (summary.successRate < 95) {
      recommendations.push("Warning: Success rate below 95%. Monitor closely.");
    }

    if (summary.details.payments.discrepancies > 0) {
      recommendations.push("Review payment operation discrepancies. Check webhook processing.");
    }

    if (summary.details.transfers.discrepancies > 0) {
      recommendations.push("Review transfer operation discrepancies. Verify seller account statuses.");
    }

    if (summary.details.accounts.discrepancies > 0) {
      recommendations.push("Update Stripe account information. Some accounts may need re-verification.");
    }

    if (summary.details.balances.discrepancies > 0) {
      recommendations.push("Platform balance discrepancy detected. Manual investigation required.");
    }

    if (summary.details.webhooks.discrepancies > 0) {
      recommendations.push("Failed webhooks detected. Review webhook processing and retry failed events.");
    }

    if (recommendations.length === 0) {
      recommendations.push("All systems operating normally. No action required.");
    }

    return recommendations;
  }

  async calculateReconciliationTrends() {
    // In a real system, this would analyze historical reconciliation data
    // For now, return placeholder data
    return {
      successRateTrend: "stable",
      discrepancyTrend: "decreasing",
      errorTrend: "stable"
    };
  }

  getWeekIdentifier() {
    const now = new Date();
    const year = now.getFullYear();
    const week = this.getWeekNumber(now);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // Status methods

  getSchedulerStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: Array.from(this.jobs.keys()),
      nextRuns: this.getNextRunTimes()
    };
  }

  getNextRunTimes() {
    const nextRuns = {};

    for (const [name, job] of this.jobs) {
      try {
        // This is a simplified version - node-cron doesn't expose next run time directly
        nextRuns[name] = "Next run time calculation not available";
      } catch (error) {
        nextRuns[name] = "Error calculating next run";
      }
    }

    return nextRuns;
  }
}

module.exports = ReconciliationScheduler;