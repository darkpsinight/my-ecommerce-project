import React from "react";
import Transactions from "@/components/Transactions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transaction Hub - Your Complete Transaction History | Digital Marketplace",
  description: "View and manage all your transaction activities including purchases, wallet funding, refunds, and withdrawals. Complete transaction history with detailed insights and filtering options.",
  keywords: "transaction history, wallet funding, purchase history, digital marketplace transactions, payment history, refunds, withdrawals, transaction hub",
  authors: [{ name: "Digital Marketplace" }],
  robots: "index, follow",
  openGraph: {
    title: "Transaction Hub - Digital Marketplace",
    description: "Track all your transaction activities including purchases and wallet funding in one comprehensive dashboard.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Transaction Hub - Digital Marketplace",
    description: "Track all your transaction activities including purchases and wallet funding in one comprehensive dashboard.",
  },
};

const TransactionsPage = () => {
  return (
    <main>
      <Transactions />
    </main>
  );
};

export default TransactionsPage;