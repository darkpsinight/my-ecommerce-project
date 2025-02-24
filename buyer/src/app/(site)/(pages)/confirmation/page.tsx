import React from "react";
import { Metadata } from "next";
import ConfirmationStatus from "@/components/ConfirmationStatus";

export const metadata: Metadata = {
  title: "Email Confirmation | NextCommerce",
  description: "Email confirmation status page for NextCommerce",
  openGraph: {
    title: "Email Confirmation | NextCommerce",
    description: "Email confirmation status page for NextCommerce",
    type: "website",
    url: "https://your-domain.com/confirmation",
  },
  alternates: {
    canonical: "https://your-domain.com/confirmation",
  },
};

const ConfirmationPage = () => {
  return (
    <main>
      <ConfirmationStatus />
    </main>
  );
};

export default ConfirmationPage; 