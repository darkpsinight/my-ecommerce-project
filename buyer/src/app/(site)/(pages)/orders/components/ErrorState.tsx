"use client";
import React from "react";
import OrdersHeader from "./OrdersHeader";

interface ErrorStateProps {
  error: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <div className="pt-24 pb-12 min-h-screen bg-gray-1">
      <OrdersHeader
        title="My Orders"
        subtitle="Something went wrong"
        icon="error"
      />
      
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-3 border border-red-light-6 overflow-hidden">
          <div className="bg-red p-6 text-center">
            <svg className="w-12 h-12 text-white mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.334 15c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-xl font-bold text-white mb-2">Unable to Load Orders</h3>
            <p className="text-red-light-4">{error}</p>
          </div>
          <div className="p-6 text-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue text-white font-semibold rounded-xl shadow-1 hover:shadow-2 hover:bg-blue-dark transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorState;