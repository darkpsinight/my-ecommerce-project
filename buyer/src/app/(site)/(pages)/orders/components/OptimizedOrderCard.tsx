"use client";
import React, { memo } from "react";
import { Order } from "@/services/orders";
import OrderCardHeader from "./OrderCardHeader";
import OrderItemsList from "./OrderItemsList";

interface OptimizedOrderCardProps {
  order: Order;
  formatDate: (dateString: string) => string;
}

/**
 * Optimized OrderCard component with React.memo for performance
 * This component will only re-render if the order prop changes
 */
const OptimizedOrderCard: React.FC<OptimizedOrderCardProps> = memo(({ order, formatDate }) => {
  // Mock review status for now - in real implementation this would come from props or hooks
  const mockReviewStatus = {
    canReview: false,
    hasExistingReview: false,
    isChecking: false
  };

  return (
    <div className="bg-white rounded-2xl shadow-3 border border-gray-3 overflow-hidden hover:shadow-2 transition-all duration-300 transform hover:-translate-y-1">
      <OrderCardHeader order={order} formatDate={formatDate} reviewStatus={mockReviewStatus} />
      <OrderItemsList order={order} />
    </div>
  );
});

// Set display name for debugging
OptimizedOrderCard.displayName = 'OptimizedOrderCard';

export default OptimizedOrderCard;