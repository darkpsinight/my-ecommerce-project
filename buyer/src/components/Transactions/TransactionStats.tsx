"use client";
import React from "react";

interface TransactionStatsProps {
  stats: {
    totalTransactions: number;
    totalFunding: number;
    totalPurchases: number;
    totalRefunds: number;
  };
}

const TransactionStats: React.FC<TransactionStatsProps> = ({ stats }) => {
  const statCards = [
    {
      title: "Total Transactions",
      value: stats.totalTransactions.toLocaleString(),
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01m3 0h.01M12 11V7"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      gradient: "from-blue to-blue-light",
      bgGradient: "from-blue-light-5 to-blue-light-4",
      textColor: "text-blue-dark",
    },
    {
      title: "Total Funding",
      value: `$${stats.totalFunding.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      gradient: "from-green to-green-light",
      bgGradient: "from-green-light-6 to-green-light-5",
      textColor: "text-green-dark",
    },
    {
      title: "Total Purchases",
      value: `$${stats.totalPurchases.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      gradient: "from-teal to-teal-light",
      bgGradient: "from-blue-light-5 to-teal-light",
      textColor: "text-teal-dark",
    },
    {
      title: "Total Refunds",
      value: `$${stats.totalRefunds.toFixed(2)}`,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      gradient: "from-yellow to-orange",
      bgGradient: "from-yellow-light-4 to-orange-light-5",
      textColor: "text-orange-dark",
    },
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`bg-gradient-to-br ${card.bgGradient} rounded-2xl p-6 shadow-lg border border-white/20 backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:shadow-xl`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                {card.icon}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-7">{card.value}</p>
              </div>
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${card.textColor} mb-1`}>{card.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionStats;