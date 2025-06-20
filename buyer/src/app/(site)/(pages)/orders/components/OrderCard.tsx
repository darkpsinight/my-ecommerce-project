"use client";
import React from "react";
import { Order } from "@/services/orders";
import OrderCardHeader from "./OrderCardHeader";
import OrderItemsList from "./OrderItemsList";

interface OrderCardProps {
  order: Order;
  formatDate: (dateString: string) => string;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, formatDate }) => {
  return (
    <div className="bg-white rounded-2xl shadow-3 border border-gray-3 overflow-hidden hover:shadow-2 transition-all duration-300 transform hover:-translate-y-1">
      <OrderCardHeader order={order} formatDate={formatDate} />
      <OrderItemsList order={order} />
    </div>
  );
};

export default OrderCard;