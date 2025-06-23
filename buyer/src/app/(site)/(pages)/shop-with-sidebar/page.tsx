import React from "react";
import ShopWithSidebar from "@/components/ShopWithSidebar";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Browse Digital Codes | Shop with Filters | Digital Marketplace",
  description: "Discover and purchase digital codes, game keys, gift cards, and more with our advanced filtering system. Find the perfect digital product for your needs.",
  keywords: "digital codes, game keys, gift cards, shop, filters, digital marketplace, buy codes online",
  openGraph: {
    title: "Browse Digital Codes | Shop with Filters",
    description: "Discover and purchase digital codes, game keys, gift cards, and more with our advanced filtering system.",
    type: "website",
  },
  // other metadata
};

const ShopWithSidebarPage = () => {
  return (
    <main>
      <ShopWithSidebar />
    </main>
  );
};

export default ShopWithSidebarPage;
