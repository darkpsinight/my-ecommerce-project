"use client";
import React from "react";

interface OrdersHeaderProps {
  title: string;
  subtitle: string;
  icon: "orders" | "loading" | "error" | "empty";
  isLoading?: boolean;
}

const OrdersHeader: React.FC<OrdersHeaderProps> = ({ title, subtitle, icon, isLoading = false }) => {
  const renderIcon = () => {
    const baseClasses = "w-8 h-8 text-white";
    const iconClasses = isLoading ? `${baseClasses} animate-pulse` : baseClasses;

    switch (icon) {
      case "orders":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "loading":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "error":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "empty":
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getIconBgColor = () => {
    switch (icon) {
      case "orders":
        return "bg-blue";
      case "loading":
        return "bg-blue";
      case "error":
        return "bg-red";
      case "empty":
        return "bg-gray-5";
      default:
        return "bg-blue";
    }
  };

  return (
    <div className="text-center mb-12">
      <div className={`inline-flex items-center justify-center w-16 h-16 ${getIconBgColor()} rounded-full mb-4 shadow-1${isLoading ? " animate-pulse" : ""}`}>
        {renderIcon()}
      </div>
      <h1 className="text-4xl font-bold text-dark mb-3">
        {title}
      </h1>
      <p className="text-body text-lg">{subtitle}</p>
    </div>
  );
};

export default OrdersHeader;