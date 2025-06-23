"use client";
import React from "react";
import { Transaction } from "@/services/transactions";
import TransactionItem from "./TransactionItem";

interface TransactionListProps {
  transactions: Transaction[];
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  return (
    <div className="divide-y divide-gray-2">
      {transactions.map((transaction, index) => (
        <TransactionItem
          key={transaction.externalId}
          transaction={transaction}
          isFirst={index === 0}
          isLast={index === transactions.length - 1}
        />
      ))}
    </div>
  );
};

export default TransactionList;