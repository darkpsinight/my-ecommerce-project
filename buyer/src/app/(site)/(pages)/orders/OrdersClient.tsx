"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useAppSelector } from "@/redux/store";
import { ordersApi, Order } from "@/services/orders";
import PageContainer from "@/components/Common/PageContainer";
import ProtectedRoute from "@/components/Common/ProtectedRoute";
import toast from "react-hot-toast";

const OrdersClient = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const token = useAppSelector((state) => state.authReducer.token);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getBuyerOrders({
        page: currentPage,
        limit: 10
      });

      if (response.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.pagination.pages);
        setError(null);
      } else {
        setError("Failed to fetch orders");
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.error || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token, currentPage, fetchOrders]);



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <ProtectedRoute
      redirectMessage="Please sign in to view your order history and digital codes."
      redirectButtonText="Sign In to View Orders"
    >
      {loading ? (
        <PageContainer>
        <div className="pt-24 pb-12 min-h-screen bg-gray-1">
          {/* Enhanced Loading Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue rounded-full mb-4 shadow-1 animate-pulse">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-dark mb-3">
              My Orders
            </h1>
            <p className="text-body text-lg">Loading your order history...</p>
          </div>
          
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-3 border border-gray-3 overflow-hidden animate-pulse">
                {/* Loading Header */}
                <div className="bg-gray-4 h-24"></div>
                {/* Loading Content */}
                <div className="p-8">
                  <div className="bg-gray-1 rounded-2xl p-6">
                    <div className="flex items-start gap-6">
                      <div className="w-24 h-24 bg-gray-4 rounded-xl"></div>
                      <div className="flex-1 space-y-4">
                        <div className="h-6 bg-gray-4 rounded-lg w-3/4"></div>
                        <div className="h-4 bg-gray-4 rounded w-1/2"></div>
                        <div className="flex gap-3">
                          <div className="h-8 bg-gray-4 rounded-full w-20"></div>
                          <div className="h-8 bg-gray-4 rounded-full w-20"></div>
                          <div className="h-8 bg-gray-4 rounded-full w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </PageContainer>
      ) : error ? (
        <PageContainer>
        <div className="pt-24 pb-12 min-h-screen bg-gray-1">
          {/* Enhanced Error Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red rounded-full mb-4 shadow-1">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-dark mb-3">
              My Orders
            </h1>
            <p className="text-body text-lg">Something went wrong</p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-3 border border-red-light-6 overflow-hidden">
              <div className="bg-red p-6 text-center">
                <svg className="w-12 h-12 text-white mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.334 15c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">Unable to Load Orders</h3>
                <p className="text-red-light-4">{error}</p>
              </div>
              <div className="p-6 text-center">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue text-white font-semibold rounded-xl shadow-1 hover:shadow-2 hover:bg-blue-dark transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
        </PageContainer>
      ) : orders.length === 0 ? (
        <PageContainer>
        <div className="pt-24 pb-12 min-h-screen bg-gray-1">
          {/* Enhanced Empty State Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-5 rounded-full mb-4 shadow-1">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-dark mb-3">
              My Orders
            </h1>
            <p className="text-body text-lg">Your order history</p>
          </div>
          
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-3 border border-gray-3 overflow-hidden">
              <div className="p-12 text-center">
                <div className="w-24 h-24 bg-blue-light-5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-dark mb-4">No orders yet</h3>
                <p className="text-body mb-8 text-lg">
                  You haven&apos;t made any purchases yet. Start shopping for digital codes and build your collection!
                </p>
                <a
                  href="/shop-with-sidebar"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-blue text-white font-bold rounded-xl shadow-1 hover:shadow-2 hover:bg-blue-dark transition-all duration-200 transform hover:-translate-y-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Start Shopping
                </a>
              </div>
            </div>
          </div>
        </div>
        </PageContainer>
      ) : (
        <PageContainer>
      <div className="pt-24 pb-12 min-h-screen bg-gray-1">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-dark mb-3">
            My Orders
          </h1>
          <p className="text-body text-lg">Track your digital code purchases and downloads</p>
        </div>
        
        <div className="space-y-8">
          {orders.map((order) => (
            <div key={order.externalId} className="bg-white rounded-2xl shadow-3 border border-gray-3 overflow-hidden hover:shadow-2 transition-all duration-300 transform hover:-translate-y-1">
              {/* Enhanced Order Header */}
              <div className="bg-blue px-6 py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold">
                        Order #{order.externalId.slice(-8).toUpperCase()}
                      </h3>
                    </div>
                    <p className="text-blue-light-4 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m0 0V6a2 2 0 002 2h3a2 2 0 002 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h3a2 2 0 002-2v1z" />
                      </svg>
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-1 ${
                      order.status === 'completed' 
                        ? 'bg-green text-white'
                        : order.status === 'pending'
                        ? 'bg-yellow text-white'
                        : 'bg-red text-white'
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        order.status === 'completed' ? 'bg-green-light-4' : order.status === 'pending' ? 'bg-yellow-light-2' : 'bg-red-light-4'
                      }`}></div>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                      <span className="text-2xl font-bold text-white">
                        ${order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Order Items */}
              <div className="p-8">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="mb-8 last:mb-0">
                    <div className="bg-gray-1 rounded-2xl p-6 border border-gray-3 shadow-1 hover:shadow-2 transition-shadow duration-200">
                      <div className="flex items-start gap-6">
                        {/* Enhanced Product Image */}
                        {item.listing?.thumbnailUrl && (
                          <div className="flex-shrink-0">
                            <div className="relative group">
                              <Image
                                src={item.listing.thumbnailUrl}
                                alt={item.listing.title}
                                width={100}
                                height={100}
                                className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-1 group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Enhanced Product Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-xl font-bold text-dark mb-2">
                              {item.listing?.title || item.title}
                            </h4>
                            <div className="text-right">
                              <p className="text-sm text-body mb-1">
                                ${item.unitPrice.toFixed(2)} × {item.quantity}
                              </p>
                              <p className="text-2xl font-bold text-blue">
                                ${item.totalPrice.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          
                          {item.listing?.description && (
                            <div className="bg-white rounded-lg p-4 mb-4 shadow-1 border border-gray-3">
                              <p className="text-sm text-body line-clamp-2" dangerouslySetInnerHTML={{ __html: item.listing.description }}>
                              </p>
                            </div>
                          )}
                          
                          {/* Enhanced Tags */}
                          <div className="flex flex-wrap gap-3 mb-4">
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue text-white shadow-1">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {item.platform}
                            </span>
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green text-white shadow-1">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0021 5.5V3.935" />
                              </svg>
                              {item.region}
                            </span>
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-teal text-white shadow-1">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              Qty: {item.quantity}
                            </span>
                          </div>
                          
                          {/* Enhanced Info Cards */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Seller Information */}
                            {order.seller && (
                              <div className="bg-white rounded-xl p-4 shadow-1 border border-gray-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-orange rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="text-xs text-body font-medium">SELLER</p>
                                    <p className="text-sm font-semibold text-dark">{order.seller.name}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Payment Method */}
                            <div className="bg-white rounded-xl p-4 shadow-1 border border-gray-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-light rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-xs text-body font-medium">PAYMENT</p>
                                  <p className="text-sm font-semibold text-dark">
                                    {order.paymentMethod === 'stripe' ? 'Credit Card' : 'Wallet'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-12">
            <div className="bg-white rounded-2xl shadow-3 border border-gray-3 p-2">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-body bg-gray-1 border border-gray-3 rounded-xl hover:bg-blue hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-1 disabled:hover:text-body"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="px-8 py-3 bg-blue rounded-xl">
                  <span className="text-sm font-bold text-white">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-body bg-gray-1 border border-gray-3 rounded-xl hover:bg-blue hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-1 disabled:hover:text-body"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
        </PageContainer>
      )}
    </ProtectedRoute>
  );
};

export default OrdersClient;
