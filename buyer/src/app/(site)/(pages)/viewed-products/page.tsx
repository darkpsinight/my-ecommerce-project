import React from "react";
import ViewedProductsPage from "@/components/ViewedProducts/ViewedProductsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recently Viewed Products | Digital Marketplace - Your Viewing History",
  description: "Browse your recently viewed digital products and codes. Keep track of products you're interested in and never lose sight of great deals on our digital marketplace.",
  keywords: "recently viewed, viewing history, digital products, digital codes, marketplace history, product tracking",
  openGraph: {
    title: "Recently Viewed Products | Digital Marketplace",
    description: "Browse your recently viewed digital products and keep track of items you're interested in.",
    type: "website",
    siteName: "Digital Marketplace",
  },
  twitter: {
    card: "summary_large_image",
    title: "Recently Viewed Products | Digital Marketplace",
    description: "Browse your recently viewed digital products and keep track of items you're interested in.",
  },
  robots: {
    index: false, // Don't index personal viewing history pages
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function ViewedProductsPageRoute() {
  return (
    <main>
      <ViewedProductsPage />
    </main>
  );
}