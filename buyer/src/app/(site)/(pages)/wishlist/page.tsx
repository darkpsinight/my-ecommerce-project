import React from "react";
import { Wishlist } from "@/components/Wishlist";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Wishlist | Digital Codes Marketplace",
  description: "View and manage your saved digital codes and games. Keep track of your favorite items and add them to cart when ready to purchase.",
  keywords: "wishlist, saved items, digital codes, games, marketplace, favorites",
  openGraph: {
    title: "My Wishlist | Digital Codes Marketplace",
    description: "View and manage your saved digital codes and games. Keep track of your favorite items and add them to cart when ready to purchase.",
    type: "website",
  },
};

const WishlistPage = () => {
  return (
    <main>
      <Wishlist />
    </main>
  );
};

export default WishlistPage;
