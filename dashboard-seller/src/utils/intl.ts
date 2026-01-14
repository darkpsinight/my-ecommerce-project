/**
 * Formats a monetary amount given in MAJOR units (e.g. 5.00 = $5.00).
 * Use this for endpoints that return float/decimal values.
 */
export const formatCurrencyMajor = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

/**
 * Formats a monetary amount given in MINOR units (e.g. 500 = $5.00).
 * Use this for endpoints that return integer cents.
 */
export const formatCurrencyMinor = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount / 100);
};

// Deprecated: Alias to Major to prevent breaking changes during refactor, 
// but consumers should migrate to explicit Major/Minor calls.
export const formatCurrency = formatCurrencyMajor;

export const formatDateTime = (dateString: string): string => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(dateString));
};
