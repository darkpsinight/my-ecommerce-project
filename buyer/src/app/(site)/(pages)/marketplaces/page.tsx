import React from "react";
import ShopWithoutSidebar from "@/components/ShopWithoutSidebar";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Marketplaces | All Digital Codes | Complete Digital Marketplace",
  description: "Browse our complete collection of digital codes, game keys, software licenses, and gift cards from various marketplaces. Find the best deals on digital products worldwide.",
  keywords: "marketplaces, digital codes, all products, game keys, software licenses, gift cards, digital marketplace, buy codes",
  openGraph: {
    title: "Marketplaces | All Digital Codes | Complete Digital Marketplace",
    description: "Browse our complete collection of digital codes, game keys, software licenses, and gift cards from various marketplaces.",
    type: "website",
  },
  // other metadata
};

const MarketplacesPage = () => {
  return (
    <main>
      <ShopWithoutSidebar />
    </main>
  );
};

export default MarketplacesPage;
