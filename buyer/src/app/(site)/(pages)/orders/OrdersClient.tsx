"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import PageContainer from "@/components/Common/PageContainer";
import ProtectedRoute from "@/components/Common/ProtectedRoute";
import { useOrders } from "./hooks/useOrders";
import { formatDate } from "./utils/dateUtils";
import LoadingState from "./components/LoadingState";
import ErrorState from "./components/ErrorState";
import EmptyState from "./components/EmptyState";
import OrdersList from "./components/OrdersList";

const OrdersClient = () => {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const {
    orders,
    loading,
    error,
    currentPage,
    totalPages,
    totalOrders,
    setCurrentPage,
  } = useOrders();

  useEffect(() => {
    setMounted(true);
    
    // Check if user just submitted a review
    const reviewSubmitted = searchParams.get('reviewSubmitted');
    if (reviewSubmitted === 'true') {
      toast.success('Thank you for your review! Your feedback helps other buyers.', {
        duration: 5000,
        style: {
          background: '#10B981',
          color: '#FFFFFF',
        },
        iconTheme: {
          primary: '#FFFFFF',
          secondary: '#10B981',
        },
      });
      
      // Clean up the URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('reviewSubmitted');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  if (!mounted) {
    return <LoadingState />;
  }

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
