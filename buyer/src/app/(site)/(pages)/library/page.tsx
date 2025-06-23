import type { Metadata } from "next";
import Library from "@/components/Library";

export const metadata: Metadata = {
  title: "Digital Library - Your Purchased Codes & Gift Collection | SecureCodeVault",
  description: "Access your complete digital library of purchased codes, game keys, software licenses, and gift cards. Manage your digital collection with detailed product information, seller data, and order history in one secure place.",
  keywords: "digital library, purchased codes, game keys, software licenses, digital downloads, gift cards, activation codes, order history, digital collection",
  openGraph: {
    title: "Digital Library - Your Digital Collection",
    description: "Access and manage your complete digital library of purchased codes, game keys, and digital products with detailed seller information and order history.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const LibraryPage = () => {
  return <Library />;
};

export default LibraryPage;