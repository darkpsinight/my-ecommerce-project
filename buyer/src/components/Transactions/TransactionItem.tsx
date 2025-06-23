"use client";
import React, { useState } from "react";
import { Transaction } from "@/services/transactions";

interface TransactionItemProps {
  transaction: Transaction;
  isFirst: boolean;
  isLast: boolean;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, isFirst, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get transaction type configuration
  const getTransactionConfig = (type: string) => {
    switch (type) {
      case "funding":
        return {
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          iconBg: "bg-gradient-to-r from-green to-green-light",
          label: "Wallet Funding",
          description: "Added funds to wallet",
        };
      case "purchase":
        return {
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          iconBg: "bg-gradient-to-r from-teal to-teal-light",
          label: "Purchase",
          description: "Digital code purchase",
        };
      case "refund":
        return {
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          iconBg: "bg-gradient-to-r from-orange to-orange-light",
          label: "Refund",
          description: "Purchase refund",
        };
      case "withdrawal":
        return {
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          iconBg: "bg-gradient-to-r from-red to-red-light",
          label: "Withdrawal",
          description: "Wallet withdrawal",
        };
      default:
        return {
          icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01m3 0h.01M12 11V7"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          iconBg: "bg-gradient-to-r from-gray-4 to-gray-5",
          label: "Transaction",
          description: "General transaction",
        };
    }
  };

  // Get status configuration
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          badge: "bg-green-light-5 text-green-dark",
          label: "Completed",
        };
      case "pending":
        return {
          badge: "bg-yellow-light-4 text-yellow-dark",
          label: "Pending",
        };
      case "failed":
        return {
          badge: "bg-red-light-5 text-red-dark",
          label: "Failed",
        };
      case "cancelled":
        return {
          badge: "bg-gray-3 text-gray-6",
          label: "Cancelled",
        };
      case "refunded":
        return {
          badge: "bg-orange-light-5 text-orange-dark",
          label: "Refunded",
        };
      default:
        return {
          badge: "bg-gray-3 text-gray-6",
          label: status,
        };
    }
  };

  const transactionConfig = getTransactionConfig(transaction.type);
  const statusConfig = getStatusConfig(transaction.status);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === "funding" || type === "refund" ? "+" : "-";
    return `${sign}$${amount.toFixed(2)}`;
  };

  const getAmountColor = (type: string) => {
    return type === "funding" || type === "refund" 
      ? "text-green-dark" 
      : "text-red-dark";
  };

  const createdDate = formatDate(transaction.createdAt);
  const processedDate = transaction.processedAt ? formatDate(transaction.processedAt) : null;

  return (
    <div className={`transition-all duration-300 ${isExpanded ? 'bg-gray-1' : 'hover:bg-gray-1'}`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Transaction Icon */}
            <div className={`w-12 h-12 ${transactionConfig.iconBg} rounded-xl flex items-center justify-center text-white shadow-lg`}>
              {transactionConfig.icon}
            </div>

            {/* Transaction Details */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-gray-7">{transactionConfig.label}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.badge}`}>
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-sm text-gray-5 mb-1">{transaction.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-5">
                <span>{createdDate.date} at {createdDate.time}</span>
                <span>ID: {transaction.externalId.slice(-8)}</span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <p className={`text-lg font-bold ${getAmountColor(transaction.type)}`}>
                {formatAmount(transaction.amount, transaction.type)}
              </p>
              <p className="text-sm text-gray-5">{transaction.currency}</p>
            </div>

            {/* Expand Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-4 p-2 rounded-lg hover:bg-gray-2 transition-colors"
            >
              <svg
                className={`w-4 h-4 text-gray-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-2">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-6 mb-1">Balance Before</h4>
                <p className="text-sm text-gray-7">${transaction.balanceBefore?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-6 mb-1">Balance After</h4>
                <p className="text-sm text-gray-7">${transaction.balanceAfter?.toFixed(2) || 'N/A'}</p>
              </div>
              {processedDate && (
                <div>
                  <h4 className="text-sm font-medium text-gray-6 mb-1">Processed Date</h4>
                  <p className="text-sm text-gray-7">{processedDate.date} at {processedDate.time}</p>
                </div>
              )}
            </div>
            
            {/* Additional Actions */}
            <div className="mt-4 flex gap-3">
              <button className="text-sm text-blue hover:text-blue-dark transition-colors">
                View Details
              </button>
              {transaction.status === "completed" && transaction.type === "purchase" && (
                <button className="text-sm text-green hover:text-green-dark transition-colors">
                  View Order
                </button>
              )}
              {transaction.status === "failed" && (
                <button className="text-sm text-red hover:text-red-dark transition-colors">
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionItem;