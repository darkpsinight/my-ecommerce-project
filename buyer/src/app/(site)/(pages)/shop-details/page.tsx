import React from "react";
import ShopDetails from "@/components/ShopDetails";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Product Details | Digital Marketplace - Buy Digital Codes Worldwide",
  description: "Discover premium digital codes and products from verified sellers. Instant delivery, secure transactions, and worldwide availability. Buy digital game codes, software licenses, and more.",
  keywords: "digital products, digital codes, game codes, software licenses, instant delivery, verified sellers, marketplace",
  openGraph: {
    title: "Digital Product Details | Digital Marketplace",
    description: "Discover premium digital codes and products from verified sellers with instant delivery and secure transactions.",
    type: "website",
    siteName: "Digital Marketplace",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Product Details | Digital Marketplace",
    description: "Discover premium digital codes and products from verified sellers with instant delivery and secure transactions.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const ShopDetailsPage = () => {
  return (
    <main>
      <ShopDetails />
    </main>
  );
};

export default ShopDetailsPage;
