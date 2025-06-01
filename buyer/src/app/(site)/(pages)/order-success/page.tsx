import React from "react";
import { Metadata } from "next";
import OrderSuccessClient from "./OrderSuccessClient";

export const metadata: Metadata = {
  title: "Order Success | Digital Codes Marketplace",
  description: "Your order has been completed successfully",
};

const OrderSuccessPage = () => {
  return <OrderSuccessClient />;
};

export default OrderSuccessPage;
