/**
 * Utility functions for digital activation codes
 */

export interface CodeExpirationInfo {
  isExpired: boolean;
  isExpiringSoon: boolean; // within 30 days
  daysUntilExpiration: number;
  formattedExpiration: string;
}

/**
 * Get expiration information for a code
 */
export const getCodeExpirationInfo = (expirationDate?: string): CodeExpirationInfo | null => {
  if (!expirationDate) {
    return null;
  }

  const expDate = new Date(expirationDate);
  const now = new Date();
  const timeDiff = expDate.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  const isExpired = daysDiff < 0;
  const isExpiringSoon = daysDiff > 0 && daysDiff <= 30;

  return {
    isExpired,
    isExpiringSoon,
    daysUntilExpiration: daysDiff,
    formattedExpiration: expDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  };
};

/**
 * Get status badge info for code expiration
 */
export const getExpirationBadgeProps = (expirationDate?: string) => {
  if (!expirationDate) {
    return {
      text: "Never expires",
      className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green/10 text-green"
    };
  }

  const expirationInfo = getCodeExpirationInfo(expirationDate);
  
  if (!expirationInfo) {
    return {
      text: "Never expires",
      className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green/10 text-green"
    };
  }

  if (expirationInfo.isExpired) {
    return {
      text: "Expired",
      className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red/10 text-red"
    };
  }

  if (expirationInfo.isExpiringSoon) {
    return {
      text: `Expires in ${expirationInfo.daysUntilExpiration} day${expirationInfo.daysUntilExpiration === 1 ? "" : "s"}`,
      className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow/10 text-yellow-dark"
    };
  }

  return {
    text: `Expires ${expirationInfo.formattedExpiration}`,
    className: "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue/10 text-blue"
  };
};

/**
 * Mask a code for display
 * If the code appears to be encrypted (long hex string), show a generic masked format
 */
export const maskCode = (code: string, visibleChars: number = 4): string => {
  // Check if code appears to be encrypted (long hex string)
  if (code.length > 20 && /^[a-f0-9]+$/i.test(code)) {
    // This is likely an encrypted code, show a generic mask
    return "••••••••••••••••";
  }
  
  // For regular codes, show partial masking
  if (code.length <= visibleChars) return code;
  const masked = "•".repeat(Math.max(0, code.length - visibleChars));
  return masked + code.slice(-visibleChars);
};

/**
 * Copy text to clipboard with feedback
 */
export const copyToClipboard = async (text: string, successMessage: string = "Copied to clipboard!"): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    // Fallback for older browsers
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
      return true;
    } catch (fallbackError) {
      console.error("Fallback copy failed:", fallbackError);
      return false;
    }
  }
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number, currency: string = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  
  return date.toLocaleDateString("en-US", { ...defaultOptions, ...options });
};

/**
 * Group codes by product
 */
export const groupCodesByProduct = (codes: any[]) => {
  return codes.reduce((groups, code) => {
    const key = `${code.productName}-${code.platform}-${code.region}`;
    if (!groups[key]) {
      groups[key] = {
        productName: code.productName,
        platform: code.platform,
        region: code.region,
        codes: [],
      };
    }
    groups[key].codes.push(code);
    return groups;
  }, {} as Record<string, any>);
};

/**
 * Filter codes by status
 */
export const filterCodesByStatus = (codes: any[], status: "active" | "expired" | "expiring") => {
  return codes.filter(code => {
    const expirationInfo = getCodeExpirationInfo(code.expirationDate);
    
    switch (status) {
      case "expired":
        return expirationInfo?.isExpired;
      case "expiring":
        return expirationInfo?.isExpiringSoon;
      case "active":
        return !expirationInfo?.isExpired;
      default:
        return true;
    }
  });
};

/**
 * Validate if code appears to be valid format
 */
export const isValidCodeFormat = (code: string): boolean => {
  // Basic validation - adjust based on your code formats
  return code.length >= 4 && /^[A-Z0-9\-]+$/i.test(code);
};