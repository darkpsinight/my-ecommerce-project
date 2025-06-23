"use client";
import React from "react";
import { PurchasedCode } from "@/services/orders";

interface LibraryStatsProps {
  totalCodes: number;
  totalOrders: number;
  platforms: string[];
  codes: PurchasedCode[];
}

const LibraryStats: React.FC<LibraryStatsProps> = ({ 
  totalCodes, 
  totalOrders, 
  platforms,
  codes 
}) => {
  // Calculate stats
  const expiredCodes = codes.filter(code => 
    code.expirationDate && new Date(code.expirationDate) < new Date()
  ).length;

  const expiringCodes = codes.filter(code => 
    code.expirationDate && 
    new Date(code.expirationDate) > new Date() &&
    new Date(code.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length;

  const activeCodes = totalCodes - expiredCodes;

  const stats = [
    {
      label: "Total Codes",
      value: totalCodes,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      gradient: "from-teal to-blue",
      bg: "from-teal/10 to-blue/10",
      border: "border-teal/20"
    },
    {
      label: "Active Codes",
      value: activeCodes,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      gradient: "from-green to-green-light",
      bg: "from-green/10 to-green-light/10",
      border: "border-green/20"
    },
    {
      label: "Total Orders",
      value: totalOrders,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 7a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      gradient: "from-blue to-blue-light",
      bg: "from-blue/10 to-blue-light/10",
      border: "border-blue/20"
    },
    {
      label: "Platforms",
      value: platforms.length,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      gradient: "from-yellow to-orange",
      bg: "from-yellow/10 to-orange/10",
      border: "border-yellow/20"
    }
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} backdrop-blur-sm rounded-2xl border ${stat.border} p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 group`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-6 mb-1">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-dark">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {stat.icon}
              </div>
            </div>
            
            {/* Decorative background pattern */}
            <div className="absolute -top-4 -right-4 w-24 h-24 opacity-5">
              <div className={`w-full h-full rounded-full bg-gradient-to-br ${stat.gradient}`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Alert for expiring codes */}
      {expiringCodes > 0 && (
        <div className="mt-6 bg-gradient-to-br from-yellow-light-4 to-orange/10 border border-yellow/20 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow to-orange flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-orange-dark">
                {expiringCodes} code{expiringCodes !== 1 ? 's' : ''} expiring soon
              </h4>
              <p className="text-sm text-gray-6">
                Some of your codes will expire within the next 7 days. Consider using them soon.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryStats;