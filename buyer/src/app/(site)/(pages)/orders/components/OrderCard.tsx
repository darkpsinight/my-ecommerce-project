"use client";
import React, { useState } from "react";
import { Order } from "@/services/orders";
import OrderCardHeader from "./OrderCardHeader";
import OrderItemsList from "./OrderItemsList";

interface ReviewStatus {
  canReview: boolean;
  hasExistingReview: boolean;
  isChecking: boolean;
}

interface OrderCardProps {
  order: Order;
  formatDate: (dateString: string) => string;
  reviewStatus: ReviewStatus;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, formatDate, reviewStatus }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-3 border border-gray-3 overflow-hidden transition-all duration-300 transform ${
      isExpanded 
        ? 'hover:shadow-1 border-blue/20' 
        : 'hover:shadow-2 hover:-translate-y-1'
    }`}>
      <div 
        className="cursor-pointer select-none"
        onClick={toggleExpanded}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} order details for order ${order.externalId}`}
      >
        <OrderCardHeader 
          order={order} 
          formatDate={formatDate} 
          isExpanded={isExpanded}
          reviewStatus={reviewStatus}
        />
      </div>
      
      <div className={`transition-all duration-500 ease-in-out ${
        isExpanded 
          ? 'max-h-[2000px] opacity-100' 
          : 'max-h-0 opacity-0'
      } overflow-hidden`}>
        <OrderItemsList order={order} />
      </div>
    </div>
  );
};

export default OrderCard;