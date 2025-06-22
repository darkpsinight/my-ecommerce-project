"use client";
import React from "react";
import PageContainer from "@/components/Common/PageContainer";
import ProtectedRoute from "@/components/Common/ProtectedRoute";
import { useOrders } from "./hooks/useOrders";
import { formatDate } from "./utils/dateUtils";
import LoadingState from "./components/LoadingState";
import ErrorState from "./components/ErrorState";
import EmptyState from "./components/EmptyState";
import OrdersList from "./components/OrdersList";

const OrdersClient = () => {
  const {
    orders,
    loading,
    error,
    currentPage,
    totalPages,
    totalOrders,
    setCurrentPage,
  } = useOrders();

  const renderContent = () => {
    if (loading) {
      return <LoadingState />;
    }

    if (error) {
      return <ErrorState error={error} />;
    }

    if (orders.length === 0) {
      return <EmptyState />;
    }

    return (
      <OrdersList
        orders={orders}
        currentPage={currentPage}
        totalPages={totalPages}
        totalOrders={totalOrders}
        onPageChange={setCurrentPage}
        formatDate={formatDate}
      />
    );
  };

  return (
    <ProtectedRoute
      redirectMessage="Please sign in to view your order history and digital codes."
      redirectButtonText="Sign In to View Orders"
    >
      <PageContainer>
        {renderContent()}
      </PageContainer>
    </ProtectedRoute>
  );
};

export default OrdersClient;
