import React from "react";
import MyAccount from "@/components/MyAccount";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account - Manage Your Digital Codes | Digital Marketplace",
  description: "Access your digital marketplace account to view purchased codes, manage orders, and update your profile. Secure, fast, and reliable digital code management.",
  keywords: "digital codes, account management, purchased codes, orders, digital marketplace, user dashboard",
  authors: [{ name: "Digital Marketplace" }],
  robots: "index, follow",
  openGraph: {
    title: "My Account - Digital Marketplace",
    description: "Manage your digital codes, orders, and account settings in one secure place.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Account - Digital Marketplace",
    description: "Manage your digital codes, orders, and account settings in one secure place.",
  },
};

const MyAccountPage = () => {
  return (
    <main>
      <MyAccount />
    </main>
  );
};

export default MyAccountPage;
