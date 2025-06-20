"use client";
import React from "react";
import OrdersHeader from "./OrdersHeader";
import { LOADING_SKELETON_COUNT } from "../constants";

const LoadingState: React.FC = () => {
  return (
    <div className="pt-24 pb-12 min-h-screen bg-gray-1">
      <OrdersHeader
        title="My Orders"
        subtitle="Loading your order history..."
        icon="loading"
        isLoading={true}
      />
      
      <div className="space-y-8">
        {[...Array(LOADING_SKELETON_COUNT)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-3 border border-gray-3 overflow-hidden animate-pulse">
            {/* Loading Header */}
            <div className="bg-gray-4 h-24"></div>
            {/* Loading Content */}
            <div className="p-8">
              <div className="bg-gray-1 rounded-2xl p-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 bg-gray-4 rounded-xl"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-6 bg-gray-4 rounded-lg w-3/4"></div>
                    <div className="h-4 bg-gray-4 rounded w-1/2"></div>
                    <div className="flex gap-3">
                      <div className="h-8 bg-gray-4 rounded-full w-20"></div>
                      <div className="h-8 bg-gray-4 rounded-full w-20"></div>
                      <div className="h-8 bg-gray-4 rounded-full w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;