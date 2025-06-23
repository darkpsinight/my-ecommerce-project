import { walletApi, TransactionData, GetTransactionsParams, TransactionsResponse as WalletTransactionsResponse } from "./wallet";

// Re-export types for consistency
export type TransactionType = "funding" | "purchase" | "refund" | "withdrawal";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled" | "refunded";

// Export transaction interface (using the existing one from wallet service)
export type Transaction = TransactionData;

// API response interface
export interface TransactionsResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Query parameters interface (using the existing one from wallet service)
export type TransactionsQuery = GetTransactionsParams;

/**
 * Get user's transaction history with pagination and filtering
 */
export const getTransactions = async (params: TransactionsQuery = {}): Promise<TransactionsResponse> => {
  try {
    const response: WalletTransactionsResponse = await walletApi.getTransactions(params);
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || "Failed to fetch transactions");
    }
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

/**
 * Get transaction statistics for summary cards
 */
export const getTransactionStats = async (): Promise<{
  totalTransactions: number;
  totalFunding: number;
  totalPurchases: number;
  totalRefunds: number;
}> => {
  try {
    // Get all transactions to calculate stats
    // Note: In a real implementation, this should be a separate API endpoint for performance
    const allTransactions = await getTransactions({ limit: 1000 });
    
    const stats = allTransactions.transactions.reduce((acc, transaction) => {
      acc.totalTransactions++;
      
      switch (transaction.type) {
        case 'funding':
          acc.totalFunding += transaction.amount;
          break;
        case 'purchase':
          acc.totalPurchases += transaction.amount;
          break;
        case 'refund':
          acc.totalRefunds += transaction.amount;
          break;
      }
      
      return acc;
    }, {
      totalTransactions: 0,
      totalFunding: 0,
      totalPurchases: 0,
      totalRefunds: 0,
    });
    
    return stats;
  } catch (error: any) {
    console.error("Error fetching transaction stats:", error);
    // Return default stats instead of throwing error
    return {
      totalTransactions: 0,
      totalFunding: 0,
      totalPurchases: 0,
      totalRefunds: 0,
    };
  }
};