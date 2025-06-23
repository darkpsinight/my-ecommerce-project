"use client";
import React from "react";
import { TransactionType, TransactionStatus } from "@/services/transactions";

interface TransactionFiltersProps {
  filters: {
    type: TransactionType | "";
    status: TransactionStatus | "";
  };
  onFilterChange: (filters: { type?: TransactionType | ""; status?: TransactionStatus | "" }) => void;
  onClearFilters: () => void;
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const transactionTypes = [
    { value: "", label: "All Types" },
    { value: "funding", label: "Wallet Funding" },
    { value: "purchase", label: "Purchases" },
    { value: "refund", label: "Refunds" },
    { value: "withdrawal", label: "Withdrawals" },
  ];

  const transactionStatuses = [
    { value: "", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "refunded", label: "Refunded" },
  ];

  const hasActiveFilters = filters.type !== "" || filters.status !== "";

  return (
    <div className="mb-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Transaction Type Filter */}
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-6 mb-2">
                Transaction Type
              </label>
              <select
                value={filters.type}
                onChange={(e) => onFilterChange({ type: e.target.value as TransactionType | "" })}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-3 focus:ring-2 focus:ring-blue focus:border-transparent shadow-sm transition-all duration-200"
              >
                {transactionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Status Filter */}
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-gray-6 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange({ status: e.target.value as TransactionStatus | "" })}
                className="w-full px-4 py-3 bg-white rounded-lg border border-gray-3 focus:ring-2 focus:ring-blue focus:border-transparent shadow-sm transition-all duration-200"
              >
                {transactionStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-4 to-gray-5 text-white rounded-lg hover:from-gray-5 hover:to-gray-6 transition-all duration-300 transform hover:scale-105 shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-gray-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-6">Active filters:</span>
              
              {filters.type && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-light-5 text-blue-dark rounded-full text-sm">
                  {transactionTypes.find(t => t.value === filters.type)?.label}
                  <button
                    onClick={() => onFilterChange({ type: "" })}
                    className="ml-1 hover:bg-blue-light-4 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </span>
              )}
              
              {filters.status && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-light text-teal-dark rounded-full text-sm">
                  {transactionStatuses.find(s => s.value === filters.status)?.label}
                  <button
                    onClick={() => onFilterChange({ status: "" })}
                    className="ml-1 hover:bg-blue-light-4 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M18 6L6 18M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;