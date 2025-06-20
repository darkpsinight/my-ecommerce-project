"use client";
import React from "react";
import OrdersHeader from "./OrdersHeader";
import { ROUTES } from "../constants";

const EmptyState: React.FC = () => {
  return (
    <div className="pt-24 pb-12 min-h-screen bg-gray-1">
      <OrdersHeader
        title="My Orders"
        subtitle="Your order history"
        icon="empty"
      />
      
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-3 border border-gray-3 overflow-hidden">
          <div className="p-12 text-center">
            <div className="w-24 h-24 bg-blue-light-5 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-dark mb-4">No orders yet</h3>
            <p className="text-body mb-8 text-lg">
              You haven&apos;t made any purchases yet. Start shopping for digital codes and build your collection!
            </p>
            <a
              href={ROUTES.SHOP}
              className="inline-flex items-center gap-3 px-8 py-4 bg-blue text-white font-bold rounded-xl shadow-1 hover:shadow-2 hover:bg-blue-dark transition-all duration-200 transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Start Shopping
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;