"use client";
import React from "react";
import { Order } from "@/services/orders";
import OrderItem from "./OrderItem";

interface OrderItemsListProps {
  order: Order;
}

const OrderItemsList: React.FC<OrderItemsListProps> = ({ order }) => {
  return (
    <div className="p-8">
      {order.orderItems.map((item, index) => (
        <div key={index} className="mb-8 last:mb-0">
          <OrderItem item={item} order={order} />
        </div>
      ))}
    </div>
  );
};

export default OrderItemsList;