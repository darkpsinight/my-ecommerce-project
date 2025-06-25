import React from "react";
import ShopWithSidebar from "@/components/ShopWithSidebar";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Products | Browse Digital Codes with Filters | Digital Marketplace",
  description: "Discover and purchase digital codes, game keys, gift cards, and more with our advanced filtering system. Find the perfect digital product for your needs.",
  keywords: "digital codes, game keys, gift cards, products, filters, digital marketplace, buy codes online",
  openGraph: {
    title: "Products | Browse Digital Codes with Filters",
    description: "Discover and purchase digital codes, game keys, gift cards, and more with our advanced filtering system.",
    type: "website",
  },
  // other metadata
};

const ProductsPage = () => {
  return (
    <main>
      <ShopWithSidebar />
    </main>
  );
};

export default ProductsPage;
