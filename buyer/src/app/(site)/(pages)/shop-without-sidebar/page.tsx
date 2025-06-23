import React from "react";
import ShopWithoutSidebar from "@/components/ShopWithoutSidebar";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "All Digital Codes | Complete Marketplace | Buy Digital Products",
  description: "Browse our complete collection of digital codes, game keys, software licenses, and gift cards. Find the best deals on digital products worldwide.",
  keywords: "digital codes, all products, game keys, software licenses, gift cards, digital marketplace, buy codes",
  openGraph: {
    title: "All Digital Codes | Complete Marketplace",
    description: "Browse our complete collection of digital codes, game keys, software licenses, and gift cards.",
    type: "website",
  },
  // other metadata
};

const ShopWithoutSidebarPage = () => {
  return (
    <main>
      <ShopWithoutSidebar />
    </main>
  );
};

export default ShopWithoutSidebarPage;
