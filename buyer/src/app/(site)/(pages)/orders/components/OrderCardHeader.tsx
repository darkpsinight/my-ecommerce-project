"use client";
import React from "react";
import { Order } from "@/services/orders";
import { getStatusColor, getStatusDotColor, getFormattedOrderId } from "../utils/orderUtils";

interface OrderCardHeaderProps {
  order: Order;
  formatDate: (dateString: string) => string;
}

const OrderCardHeader: React.FC<OrderCardHeaderProps> = ({ order, formatDate }) => {

  return (
    <div className="bg-blue px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold">
              Order {getFormattedOrderId(order.externalId)}
            </h3>
          </div>
          <p className="text-blue-light-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m0 0V6a2 2 0 002 2h3a2 2 0 002 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h3a2 2 0 002-2v1z" />
            </svg>
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-1 ${getStatusColor(order.status)}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(order.status)}`}></div>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
            <span className="text-2xl font-bold text-white">
              ${order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCardHeader;