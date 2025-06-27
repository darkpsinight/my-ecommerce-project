import React from "react";
import { Metadata } from "next";
import OrderSuccessClient from "./OrderSuccessClient";

export const metadata: Metadata = {
  title: "Order Success - Thank You for Your Purchase | Digital Codes Marketplace",
  description: "Your digital code purchase has been completed successfully. Access your codes instantly and leave a review to help other buyers. Secure, fast, and reliable digital marketplace.",
  keywords: "order success, digital codes, purchase complete, instant delivery, game codes, software keys, review system",
  openGraph: {
    title: "Order Success - Thank You for Your Purchase",
    description: "Your digital code purchase has been completed successfully. Access your codes instantly and leave a review.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Order Success - Thank You for Your Purchase",
    description: "Your digital code purchase has been completed successfully.",
  },
  robots: {
    index: false, // Don't index order success pages for privacy
    follow: true,
  },
};

const OrderSuccessPage = () => {
  return <OrderSuccessClient />;
};

export default OrderSuccessPage;
