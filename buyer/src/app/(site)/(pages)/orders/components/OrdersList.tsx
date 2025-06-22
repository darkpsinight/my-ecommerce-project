"use client";
import React from "react";
import { Order } from "@/services/orders";
import OrdersHeader from "./OrdersHeader";
import OrderCard from "./OrderCard";
import OrdersPagination from "./OrdersPagination";

interface OrdersListProps {
  orders: Order[];
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  onPageChange: (page: number) => void;
  formatDate: (dateString: string) => string;
}

const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  currentPage,
  totalPages,
  totalOrders,
  onPageChange,
  formatDate,
}) => {
  return (
    <div className="pt-20 sm:pt-20 pb-12 min-h-screen bg-gray-1">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-0">
        <OrdersHeader
          title="My Orders"
          subtitle="Track your digital code purchases and downloads. Click on any order to view details."
          icon="orders"
          totalOrders={totalOrders}
        />
        
        {orders.length > 0 && (
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <div className="bg-blue-light-5 border border-blue-light-3 rounded-xl p-4 sm:p-5 lg:p-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-blue rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-blue-dark font-medium">
                    Click on any order header to expand and view detailed information including digital codes, download links, and transaction details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {orders.map((order) => (
            <OrderCard
              key={order.externalId}
              order={order}
              formatDate={formatDate}
            />
          ))}
        </div>

        <OrdersPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};

export default OrdersList;