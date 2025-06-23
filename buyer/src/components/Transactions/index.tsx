"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import PageContainer from "../Common/PageContainer";
import ProtectedRoute from "../Common/ProtectedRoute";
import TransactionStats from "./TransactionStats";
import TransactionFilters from "./TransactionFilters";
import TransactionList from "./TransactionList";
import TransactionPagination from "./TransactionPagination";
import TransactionSkeleton from "./TransactionSkeleton";

import { getTransactions, getTransactionStats, Transaction, TransactionType, TransactionStatus } from "@/services/transactions";

interface TransactionFiltersState {
  type: TransactionType | "";
  status: TransactionStatus | "";
  page: number;
  limit: number;
}

const Transactions = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalFunding: 0,
    totalPurchases: 0,
    totalRefunds: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  
  const [filters, setFilters] = useState<TransactionFiltersState>({
    type: "",
    status: "",
    page: 1,
    limit: 20,
  });

  // Initialize filters from URL params
  useEffect(() => {
    const typeParam = searchParams.get("type") as TransactionType | null;
    const statusParam = searchParams.get("status") as TransactionStatus | null;
    const pageParam = searchParams.get("page");
    
    setFilters(prev => ({
      ...prev,
      type: typeParam || "",
      status: statusParam || "",
      page: pageParam ? parseInt(pageParam) : 1,
    }));
  }, [searchParams]);

  const   = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
      };
      
      const response = await getTransactions(params);
      setTransactions(response.transactions);
      setPagination(response.pagination);
    } catch (err: any) {
      console.error("Error fetching transactions:", err);
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [filters, fetchTransactions]);

  // Fetch transaction stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const statsData = await getTransactionStats();
      setStats(statsData);
    } catch (err) {
      console.error("Error fetching transaction stats:", err);
      // Don't set error for stats, just log it
    }
  };

  const handleFilterChange = (newFilters: Partial<TransactionFiltersState>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }; // Reset to page 1 when filters change
    setFilters(updatedFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (updatedFilters.type) params.set("type", updatedFilters.type);
    if (updatedFilters.status) params.set("status", updatedFilters.status);
    if (updatedFilters.page > 1) params.set("page", updatedFilters.page.toString());
    
    const queryString = params.toString();
    router.push(`/transactions${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    
    // Update URL with new page
    const params = new URLSearchParams(searchParams);
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }
    
    const queryString = params.toString();
    router.push(`/transactions${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      status: "",
      page: 1,
      limit: 20,
    });
    router.push("/transactions", { scroll: false });
  };

  return (
    <ProtectedRoute
      redirectMessage="Please sign in to view your transaction history and manage your account activities."
      redirectButtonText="Sign In to View Transactions"
    >
      <PageContainer fullWidth={true}>
        <section className="min-h-screen pt-[120px] pb-20 bg-gradient-to-br from-blue-light-5 via-white to-teal-light">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6">
            {/* Header Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-teal to-blue rounded-2xl mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01m3 0h.01M12 11V7m-8 4h2l3-3 3 3h2M4 7h16M4 17h16"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-dark to-blue bg-clip-text text-transparent mb-4">
                Transaction Hub
              </h1>
              <p className="text-lg text-gray-6 max-w-2xl mx-auto">
                Track all your transaction activities including purchases, wallet funding, refunds, and withdrawals in one comprehensive dashboard.
              </p>
            </div>

            {/* Transaction Stats */}
            <TransactionStats stats={stats} />

            {/* Filters */}
            <TransactionFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />

            {/* Main Content */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2 border border-white/20 overflow-hidden">
              <div className="p-6 border-b border-gray-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-7">Transaction History</h2>
                    <p className="text-gray-5">
                      {pagination.total > 0 
                        ? `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} transactions`
                        : "No transactions found"
                      }
                    </p>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.location.href = '/wallet'}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green to-green-light text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Add Funds
                    </button>
                    <button
                      onClick={fetchTransactions}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue to-blue-light text-white rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction List */}
              <div className="min-h-[500px]">
                {loading ? (
                  <TransactionSkeleton />
                ) : error ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-red-light-5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-7 mb-2">Failed to Load Transactions</h3>
                    <p className="text-gray-5 mb-4">{error}</p>
                    <button
                      onClick={fetchTransactions}
                      className="px-6 py-2 bg-gradient-to-r from-blue to-blue-light text-white rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      Try Again
                    </button>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-2 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-5" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01m3 0h.01M12 11V7"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-7 mb-2">No Transactions Found</h3>
                    <p className="text-gray-5 mb-4">
                      {filters.type || filters.status 
                        ? "No transactions match your current filters. Try adjusting your search criteria."
                        : "You haven't made any transactions yet. Start by adding funds to your wallet or making a purchase."
                      }
                    </p>
                    {(filters.type || filters.status) && (
                      <button
                        onClick={clearFilters}
                        className="px-6 py-2 bg-gradient-to-r from-blue to-blue-light text-white rounded-lg hover:shadow-lg transition-all duration-300"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <TransactionList transactions={transactions} />
                    {pagination.pages > 1 && (
                      <div className="p-6 border-t border-gray-2">
                        <TransactionPagination
                          currentPage={pagination.page}
                          totalPages={pagination.pages}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    </ProtectedRoute>
  );
};

export default Transactions;