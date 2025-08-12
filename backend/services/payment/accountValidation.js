// Account-specific validation utilities for Stripe Connect

const { PaymentError } = require("./paymentErrors");

class AccountValidation {
  // Validate business type for Stripe Connect
  static validateBusinessType(businessType) {
    const supportedTypes = ["individual", "company"];
    
    if (!supportedTypes.includes(businessType)) {
      throw new PaymentError(
        `Business type ${businessType} is not supported. Supported types: ${supportedTypes.join(", ")}`,
        "UNSUPPORTED_BUSINESS_TYPE",
        400
      );
    }
    
    return businessType;
  }

  // Validate capabilities for Stripe Connect
  static validateCapabilities(capabilities) {
    const supportedCapabilities = [
      "card_payments",
      "transfers",
      "tax_reporting_us_1099_k",
      "tax_reporting_us_1099_misc"
    ];
    
    if (!Array.isArray(capabilities)) {
      throw new PaymentError(
        "Capabilities must be an array",
        "INVALID_CAPABILITIES_FORMAT",
        400
      );
    }
    
    const invalidCapabilities = capabilities.filter(cap => !supportedCapabilities.includes(cap));
    if (invalidCapabilities.length > 0) {
      throw new PaymentError(
        `Unsupported capabilities: ${invalidCapabilities.join(", ")}. Supported: ${supportedCapabilities.join(", ")}`,
        "UNSUPPORTED_CAPABILITIES",
        400
      );
    }
    
    return capabilities;
  }

  // Validate account requirements completion
  static validateAccountRequirements(requirements) {
    const criticalRequirements = [
      "individual.first_name",
      "individual.last_name",
      "individual.dob.day",
      "individual.dob.month",
      "individual.dob.year",
      "individual.address.line1",
      "individual.address.city",
      "individual.address.state",
      "individual.address.postal_code",
      "individual.ssn_last_4",
      "tos_acceptance.date",
      "tos_acceptance.ip"
    ];

    const missingCritical = requirements.currently_due?.filter(req => 
      criticalRequirements.includes(req)
    ) || [];

    const overdueCritical = requirements.past_due?.filter(req => 
      criticalRequirements.includes(req)
    ) || [];

    return {
      isComplete: missingCritical.length === 0 && overdueCritical.length === 0,
      missingCritical,
      overdueCritical,
      totalMissing: requirements.currently_due?.length || 0,
      totalOverdue: requirements.past_due?.length || 0
    };
  }

  // Validate seller eligibility for account creation
  static validateSellerEligibility(seller) {
    const errors = [];

    if (!seller) {
      throw new PaymentError(
        "Seller information is required",
        "SELLER_REQUIRED",
        400
      );
    }

    if (!seller.email || !this.isValidEmail(seller.email)) {
      errors.push("Valid email address is required");
    }

    if (!seller.isActive) {
      errors.push("Seller account must be active");
    }

    if (seller.role !== "seller") {
      errors.push("User must have seller role");
    }

    // Check for any existing restrictions or flags
    if (seller.isRestricted) {
      errors.push("Seller account is currently restricted");
    }

    if (seller.isSuspended) {
      errors.push("Seller account is currently suspended");
    }

    if (errors.length > 0) {
      throw new PaymentError(
        `Seller eligibility validation failed: ${errors.join(", ")}`,
        "SELLER_ELIGIBILITY_FAILED",
        400,
        { errors }
      );
    }

    return true;
  }

  // Validate account status for transfers
  static validateAccountForTransfers(stripeAccount) {
    const errors = [];

    if (!stripeAccount.chargesEnabled) {
      errors.push("Charges are not enabled for this account");
    }

    if (!stripeAccount.payoutsEnabled) {
      errors.push("Payouts are not enabled for this account");
    }

    if (!stripeAccount.detailsSubmitted) {
      errors.push("Account details have not been submitted");
    }

    if (stripeAccount.currentlyDue && stripeAccount.currentlyDue.length > 0) {
      errors.push(`Missing required information: ${stripeAccount.currentlyDue.join(", ")}`);
    }

    if (stripeAccount.pastDue && stripeAccount.pastDue.length > 0) {
      errors.push(`Overdue requirements: ${stripeAccount.pastDue.join(", ")}`);
    }

    if (stripeAccount.status === "restricted") {
      errors.push("Account is currently restricted");
    }

    if (stripeAccount.status === "rejected") {
      errors.push("Account has been rejected");
    }

    if (errors.length > 0) {
      throw new PaymentError(
        `Account not ready for transfers: ${errors.join(", ")}`,
        "ACCOUNT_NOT_TRANSFER_READY",
        400,
        { 
          errors,
          accountId: stripeAccount.stripeAccountId,
          status: stripeAccount.status
        }
      );
    }

    return true;
  }

  // Validate onboarding completion
  static validateOnboardingCompletion(stripeAccount) {
    const completionChecks = {
      detailsSubmitted: stripeAccount.detailsSubmitted,
      chargesEnabled: stripeAccount.chargesEnabled,
      payoutsEnabled: stripeAccount.payoutsEnabled,
      noCurrentRequirements: !stripeAccount.currentlyDue || stripeAccount.currentlyDue.length === 0,
      noPastDueRequirements: !stripeAccount.pastDue || stripeAccount.pastDue.length === 0,
      statusVerified: stripeAccount.status === "verified"
    };

    const completionScore = Object.values(completionChecks).filter(Boolean).length;
    const totalChecks = Object.keys(completionChecks).length;
    const completionPercentage = (completionScore / totalChecks) * 100;

    return {
      isComplete: completionScore === totalChecks,
      completionPercentage,
      completionScore,
      totalChecks,
      checks: completionChecks,
      nextSteps: this.getNextOnboardingSteps(stripeAccount)
    };
  }

  // Get next steps for onboarding completion
  static getNextOnboardingSteps(stripeAccount) {
    const steps = [];

    if (!stripeAccount.detailsSubmitted) {
      steps.push({
        step: "complete_onboarding",
        description: "Complete the Stripe Connect onboarding process",
        priority: "high"
      });
    }

    if (stripeAccount.currentlyDue && stripeAccount.currentlyDue.length > 0) {
      steps.push({
        step: "provide_required_info",
        description: `Provide missing information: ${stripeAccount.currentlyDue.join(", ")}`,
        priority: "high",
        requirements: stripeAccount.currentlyDue
      });
    }

    if (stripeAccount.pastDue && stripeAccount.pastDue.length > 0) {
      steps.push({
        step: "resolve_overdue_requirements",
        description: `Resolve overdue requirements: ${stripeAccount.pastDue.join(", ")}`,
        priority: "critical",
        requirements: stripeAccount.pastDue
      });
    }

    if (stripeAccount.pendingVerification && stripeAccount.pendingVerification.length > 0) {
      steps.push({
        step: "await_verification",
        description: `Awaiting verification for: ${stripeAccount.pendingVerification.join(", ")}`,
        priority: "medium",
        requirements: stripeAccount.pendingVerification
      });
    }

    if (!stripeAccount.chargesEnabled || !stripeAccount.payoutsEnabled) {
      steps.push({
        step: "await_capability_activation",
        description: "Awaiting activation of payment capabilities",
        priority: "medium"
      });
    }

    return steps;
  }

  // Helper method to validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate account link parameters
  static validateAccountLinkParams(params) {
    const { refreshUrl, returnUrl, type = "account_onboarding" } = params;

    const supportedTypes = ["account_onboarding", "account_update"];
    if (!supportedTypes.includes(type)) {
      throw new PaymentError(
        `Account link type ${type} is not supported`,
        "UNSUPPORTED_LINK_TYPE",
        400
      );
    }

    if (!refreshUrl || !this.isValidUrl(refreshUrl)) {
      throw new PaymentError(
        "Valid refresh URL is required",
        "INVALID_REFRESH_URL",
        400
      );
    }

    if (!returnUrl || !this.isValidUrl(returnUrl)) {
      throw new PaymentError(
        "Valid return URL is required",
        "INVALID_RETURN_URL",
        400
      );
    }

    return {
      refreshUrl,
      returnUrl,
      type
    };
  }

  // Helper method to validate URL format
  static isValidUrl(url) {
    try {
      const urlObj = new URL(url);
      return ["http:", "https:"].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Validate platform fee rate
  static validatePlatformFeeRate(feeRate) {
    if (typeof feeRate !== "number") {
      throw new PaymentError(
        "Platform fee rate must be a number",
        "INVALID_FEE_RATE_TYPE",
        400
      );
    }

    if (feeRate < 0 || feeRate > 0.3) { // Max 30% platform fee
      throw new PaymentError(
        "Platform fee rate must be between 0 and 0.3 (30%)",
        "INVALID_FEE_RATE_RANGE",
        400
      );
    }

    return feeRate;
  }
}

module.exports = AccountValidation;