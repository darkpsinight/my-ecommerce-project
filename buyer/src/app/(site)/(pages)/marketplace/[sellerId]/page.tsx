import React from "react";
import ShopWithSidebar from "@/components/ShopWithSidebar";
import { Metadata } from "next";

interface MarketplacePageProps {
  params: {
    sellerId: string;
  };
}

export async function generateMetadata({ params }: MarketplacePageProps): Promise<Metadata> {
  // In a real app, you'd fetch seller data here for better SEO
  return {
    title: `Marketplace - Digital Codes from Trusted Seller`,
    description: `Browse digital codes, game keys, software licenses, and gift cards from this verified marketplace seller.`,
    keywords: "digital codes, marketplace, seller, game keys, software licenses, gift cards",
    openGraph: {
      title: `Marketplace - Digital Codes from Trusted Seller`,
      description: `Browse digital codes, game keys, software licenses, and gift cards from this verified marketplace seller.`,
      type: "website",
    },
  };
}

const MarketplacePage = ({ params }: MarketplacePageProps) => {
  return (
    <main>
      <ShopWithSidebar />
    </main>
  );
};

export default MarketplacePage;