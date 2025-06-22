import React from "react";
import MyAccount from "@/components/MyAccount";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile Settings - Manage Your Account | Digital Marketplace",
  description: "Manage your personal information, security settings, notifications, and privacy preferences. Complete control over your digital marketplace account.",
  keywords: "profile settings, account management, security settings, privacy, notifications, digital marketplace, user preferences",
  authors: [{ name: "Digital Marketplace" }],
  robots: "index, follow",
  openGraph: {
    title: "Profile Settings - Digital Marketplace",
    description: "Manage your personal information, security settings, and account preferences in one secure place.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Profile Settings - Digital Marketplace",
    description: "Manage your personal information, security settings, and account preferences in one secure place.",
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
