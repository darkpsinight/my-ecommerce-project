"use client";
import React from "react";
import Link from "next/link";
import { Order } from "@/services/orders";
import { getStatusColor, getStatusDotColor, getFormattedOrderId } from "../utils/orderUtils";
import { FaShoppingBasket } from "react-icons/fa";
import ReviewButton from "./ReviewButton";

interface ReviewStatus {
  canReview: boolean;
  hasExistingReview: boolean;
  isChecking: boolean;
}

interface OrderCardHeaderProps {
  order: Order;
  formatDate: (dateString: string) => string;
  isExpanded?: boolean;
  reviewStatus: ReviewStatus;
}

const OrderCardHeader: React.FC<OrderCardHeaderProps> = ({ order, formatDate, isExpanded = false, reviewStatus }) => {

  return (
    <div className="bg-blue px-4 sm:px-6 py-4 sm:py-6 hover:bg-blue-dark transition-colors duration-200">
      <div className="flex flex-col gap-4">
        <div className="text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FaShoppingBasket className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold">
                Order {getFormattedOrderId(order.externalId)}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-light-4 text-xs sm:text-sm hidden sm:inline">
                {isExpanded ? 'Click to collapse' : 'Click to expand'}
              </span>
              <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-blue-light-4 flex items-center gap-2 text-sm sm:text-base">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m0 0V6a2 2 0 002 2h3a2 2 0 002 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h3a2 2 0 002-2v1z" />
              </svg>
              <span className="break-words">Placed on {formatDate(order.createdAt)}</span>
            </p>
            <div className="flex items-center gap-2 text-blue-light-4 text-xs sm:text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>{order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {/* Status Badge & Dispute Button */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-1 ${getStatusColor(order.status)} w-fit`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(order.status)}`}></div>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>

            {order.isDisputed && (
              <Link
                href={`/disputes/${order.disputeId || order.externalId}`}
                onClick={(e) => e.stopPropagation()}
                className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold py-2 px-4 rounded-full shadow-sm transition-colors"
              >
                View Dispute
              </Link>
            )}
          </div>

          {/* Review Button and Price - Different layouts for small vs large screens */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Small screens: Review button and price on same line */}
            <div className="flex sm:hidden items-center justify-between w-full">
              {order.status === 'completed' && (
                <ReviewButton
                  orderId={order.externalId}
                  canReview={reviewStatus.canReview}
                  isChecking={reviewStatus.isChecking}
                  hasExistingReview={reviewStatus.hasExistingReview}
                />
              )}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 w-fit ml-auto">
                <span className="text-xl font-bold text-white">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Large screens: Original layout */}
            <div className="hidden sm:flex sm:items-center gap-3">
              {order.status === 'completed' && (
                <ReviewButton
                  orderId={order.externalId}
                  canReview={reviewStatus.canReview}
                  isChecking={reviewStatus.isChecking}
                  hasExistingReview={reviewStatus.hasExistingReview}
                />
              )}
            </div>
            <div className="hidden sm:block bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 w-fit">
              <span className="text-2xl font-bold text-white">
                ${order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCardHeader;