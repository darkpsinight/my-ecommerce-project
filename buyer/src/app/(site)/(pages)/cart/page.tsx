import React from "react";
import Cart from "@/components/Cart";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Shopping Cart | Digital Codes Marketplace - Secure & Global",
  description: "Review your digital codes and vouchers in your cart. Buy and sell digital products worldwide with zero fees. Secure transactions with instant delivery.",
  keywords: "digital codes, shopping cart, digital vouchers, game codes, gift cards, instant delivery, secure marketplace",
  openGraph: {
    title: "Shopping Cart | Digital Codes Marketplace",
    description: "Review your digital codes and vouchers in your cart. Buy and sell digital products worldwide with zero fees.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shopping Cart | Digital Codes Marketplace", 
    description: "Review your digital codes and vouchers in your cart. Buy and sell digital products worldwide with zero fees.",
  },
};

const CartPage = () => {
  return (
    <>
      <Cart />
    </>
  );
};

export default CartPage;
