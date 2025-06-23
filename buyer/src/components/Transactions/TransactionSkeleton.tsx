"use client";
import React from "react";

const TransactionSkeleton: React.FC = () => {
  return (
    <div className="divide-y divide-gray-2">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Icon Skeleton */}
              <div className="w-12 h-12 bg-gray-3 rounded-xl"></div>

              {/* Details Skeleton */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-4 bg-gray-3 rounded w-32"></div>
                  <div className="h-5 bg-gray-3 rounded-full w-20"></div>
                </div>
                <div className="h-3 bg-gray-2 rounded w-48 mb-2"></div>
                <div className="flex items-center gap-4">
                  <div className="h-3 bg-gray-2 rounded w-24"></div>
                  <div className="h-3 bg-gray-2 rounded w-16"></div>
                </div>
              </div>

              {/* Amount Skeleton */}
              <div className="text-right">
                <div className="h-5 bg-gray-3 rounded w-20 mb-1"></div>
                <div className="h-3 bg-gray-2 rounded w-12"></div>
              </div>

              {/* Expand Button Skeleton */}
              <div className="ml-4 w-8 h-8 bg-gray-3 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionSkeleton;