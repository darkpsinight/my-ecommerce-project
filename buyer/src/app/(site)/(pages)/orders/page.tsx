import React from "react";
import { Metadata } from "next";
import OrdersClient from "./OrdersClient";

export const metadata: Metadata = {
  title: "My Orders | Digital Codes Marketplace",
  description: "View your purchased digital codes and order history",
};

const OrdersPage = () => {
  return <OrdersClient />;
};

export default OrdersPage;
