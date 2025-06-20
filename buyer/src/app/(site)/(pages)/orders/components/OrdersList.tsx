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
  onPageChange: (page: number) => void;
  formatDate: (dateString: string) => string;
}

const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  currentPage,
  totalPages,
  onPageChange,
  formatDate,
}) => {
  return (
    <div className="pt-24 pb-12 min-h-screen bg-gray-1">
      <OrdersHeader
        title="My Orders"
        subtitle="Track your digital code purchases and downloads"
        icon="orders"
      />
      
      <div className="space-y-8">
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
  );
};

export default OrdersList;