"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ordersApi, Order } from "@/services/orders";
import { toast } from "react-hot-toast";
import PageContainer from "../Common/PageContainer";
import { maskCode } from "@/utils/codeUtils";

interface PurchaseSuccessProps {
  purchaseId: string;
}

const PurchaseSuccess: React.FC<PurchaseSuccessProps> = ({ purchaseId }) => {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());
  const [decryptedCodes, setDecryptedCodes] = useState<Map<string, string>>(new Map());
  const [decryptingCodes, setDecryptingCodes] = useState<Set<string>>(new Set());

  // Decrypt code using API
  const decryptCode = async (codeId: string, orderId: string): Promise<string> => {
    // Check if we already have the decrypted code
    if (decryptedCodes.has(codeId)) {
      return decryptedCodes.get(codeId)!;
    }

    // Check if we're already decrypting this code
    if (decryptingCodes.has(codeId)) {
      throw new Error("Already decrypting");
    }

    try {
      setDecryptingCodes(prev => new Set(prev).add(codeId));
      
      const response = await ordersApi.decryptCode({
        codeId: codeId,
        orderId: orderId
      });

      if (response.success) {
        // Store the decrypted code
        setDecryptedCodes(prev => new Map(prev).set(codeId, response.data.decryptedCode));
        return response.data.decryptedCode;
      } else {
        throw new Error("Failed to decrypt code");
      }
    } catch (error) {
      console.error("Error decrypting code:", error);
      throw error;
    } finally {
      setDecryptingCodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(codeId);
        return newSet;
      });
    }
  };

  // Toggle code visibility
  const toggleCodeVisibility = async (codeId: string, orderId: string) => {
    const newVisibleCodes = new Set(visibleCodes);
    if (newVisibleCodes.has(codeId)) {
      newVisibleCodes.delete(codeId);
    } else {
      newVisibleCodes.add(codeId);
      // Decrypt the code when showing it
      try {
        await decryptCode(codeId, orderId);
      } catch (error) {
        // Remove from visible codes if decryption failed
        newVisibleCodes.delete(codeId);
        toast.error("Failed to decrypt code");
      }
    }
    setVisibleCodes(newVisibleCodes);
  };

  // Copy code to clipboard
  const copyToClipboard = async (codeId: string, orderId: string) => {
    try {
      let actualCode;
      if (decryptedCodes.has(codeId)) {
        actualCode = decryptedCodes.get(codeId)!;
      } else {
        actualCode = await decryptCode(codeId, orderId);
      }
      
      await navigator.clipboard.writeText(actualCode);
      toast.success("Code copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Failed to copy code");
    }
  };

  // Mask code for display
  const maskCode = (code: string): string => {
    if (code.length <= 4) return code;
    const visibleChars = 4;
    const masked = "X".repeat(Math.max(0, code.length - visibleChars));
    return masked + code.slice(-visibleChars);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD"): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ordersApi.getOrderById(purchaseId);

      if (response.success) {
        setOrder(response.data.order);
        // Auto-show codes for first successful purchase view
        if (response.data.order.status === "completed" && response.data.order.deliveryStatus === "delivered") {
          const allCodeIds = new Set<string>();
          response.data.order.orderItems.forEach(item => {
            if (item.purchasedCodes) {
              item.purchasedCodes.forEach(code => {
                allCodeIds.add(code.codeId);
              });
            }
          });
          setVisibleCodes(allCodeIds);
        }
      } else {
        throw new Error("Failed to fetch order");
      }
    } catch (error: any) {
      console.error("Error fetching order:", error);
      setError(error.message || "Failed to load order details");
      
      // If order not found, redirect to orders page after a delay
      if (error.response?.status === 404) {
        setTimeout(() => {
          router.push("/my-account?tab=orders");
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  }, [purchaseId, router]);

  // Initial load
  useEffect(() => {
    if (purchaseId) {
      fetchOrder();
    }
  }, [purchaseId, fetchOrder]);

  if (loading) {
    return (
      <PageContainer>
        <section className="overflow-hidden pt-[95px] py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
                <p className="mt-4 text-gray-600">Loading your purchase details...</p>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <section className="overflow-hidden pt-[95px] py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="bg-white rounded-xl shadow-1 p-8">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-red-600 mb-2">Order Not Found</h1>
                <p className="text-gray-600 mb-6">
                  We couldn&apos;t find the order you&apos;re looking for. You&apos;ll be redirected to your orders page.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link
                    href="/my-account?tab=orders"
                    className="px-6 py-3 bg-blue text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    View All Orders
                  </Link>
                  <button
                    onClick={() => fetchOrder()}
                    className="px-6 py-3 border border-gray-3 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    );
  }

  if (!order) {
    return null;
  }

  const isCompleted = order.status === "completed" && order.deliveryStatus === "delivered";
  const isPending = order.status === "pending" || order.status === "processing";
  const isFailed = order.status === "failed";

  return (
    <PageContainer>
      <section className="overflow-hidden pt-[95px] py-20 bg-gray-2">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="space-y-6">
            {/* Success Header */}
            <div className="bg-white rounded-xl shadow-1 p-8">
              <div className="text-center">
                {isCompleted && (
                  <>
                    <div className="text-green-500 text-6xl mb-4">✅</div>
                    <h1 className="text-3xl font-bold text-dark mb-2">Purchase Successful!</h1>
                    <p className="text-gray-600 text-lg">
                      Your digital codes have been delivered and are ready to use.
                    </p>
                  </>
                )}
                
                {isPending && (
                  <>
                    <div className="text-yellow-500 text-6xl mb-4">⏳</div>
                    <h1 className="text-3xl font-bold text-dark mb-2">Processing Your Order</h1>
                    <p className="text-gray-600 text-lg">
                      Your payment is being processed. You&apos;ll receive your codes shortly.
                    </p>
                  </>
                )}
                
                {isFailed && (
                  <>
                    <div className="text-red-500 text-6xl mb-4">❌</div>
                    <h1 className="text-3xl font-bold text-dark mb-2">Order Failed</h1>
                    <p className="text-gray-600 text-lg">
                      There was an issue with your order. Please contact support.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-1 p-8">
              <h2 className="text-xl font-semibold text-dark mb-6">Order Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Order Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-mono">{order.externalId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isCompleted ? "bg-green-100 text-green-800" :
                        isPending ? "bg-yellow-100 text-yellow-800" :
                        isFailed ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Payment Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-semibold">{formatCurrency(order.totalAmount, order.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method:</span>
                      <span className="capitalize">{order.paymentMethod}</span>
                    </div>
                    {order.deliveredAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Delivered:</span>
                        <span>{formatDate(order.deliveredAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Codes */}
            {isCompleted && (
              <div className="bg-white rounded-xl shadow-1 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-dark">Your Digital Codes</h2>
                  <div className="text-sm text-gray-600">
                    {order.orderItems.reduce((total, item) => total + (item.purchasedCodes?.length || 0), 0)} codes delivered
                  </div>
                </div>

                <div className="space-y-6">
                  {order.orderItems.map((item, itemIndex) => (
                    <div key={itemIndex} className="border border-gray-3 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-dark text-lg">{item.title}</h3>
                          <p className="text-gray-600">{item.platform} • {item.region}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Quantity: {item.quantity} • {formatCurrency(item.unitPrice)} each
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                        </div>
                      </div>

                      {item.purchasedCodes && item.purchasedCodes.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-700">Activation Codes</h4>
                          
                          {/* Desktop View */}
                          <div className="hidden md:block">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-3">
                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Code</th>
                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Expiration</th>
                                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.purchasedCodes.map((code) => (
                                    <tr key={code.codeId} className="border-b border-gray-1">
                                      <td className="py-3 px-3">
                                        <span className="font-mono text-sm bg-gray-100 px-3 py-2 rounded border">
                                          {visibleCodes.has(code.codeId) 
                                            ? (decryptingCodes.has(code.codeId) 
                                                ? "Decrypting..." 
                                                : (decryptedCodes.get(code.codeId) || "••••••••••••••••"))
                                            : "••••••••••••••••"
                                          }
                                        </span>
                                      </td>
                                      <td className="py-3 px-3">
                                        <span className="text-sm text-gray-600">
                                          {code.expirationDate ? formatDate(code.expirationDate) : "No expiration"}
                                        </span>
                                      </td>
                                      <td className="py-3 px-3">
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => toggleCodeVisibility(code.codeId, order.externalId)}
                                            disabled={decryptingCodes.has(code.codeId)}
                                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {decryptingCodes.has(code.codeId) ? "..." : (visibleCodes.has(code.codeId) ? "Hide" : "Show")}
                                          </button>
                                          <button
                                            onClick={() => copyToClipboard(code.codeId, order.externalId)}
                                            className="px-3 py-1 text-sm bg-blue text-white rounded hover:bg-blue-600 transition-colors"
                                          >
                                            Copy
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Mobile View */}
                          <div className="md:hidden space-y-3">
                            {item.purchasedCodes.map((code) => (
                              <div key={code.codeId} className="border border-gray-3 rounded-lg p-4 bg-gray-50">
                                <div className="mb-3">
                                  <div className="text-xs text-gray-500 mb-1">Activation Code</div>
                                  <span className="font-mono text-sm bg-white px-3 py-2 rounded border block">
                                    {visibleCodes.has(code.codeId) 
                                      ? (decryptingCodes.has(code.codeId) 
                                          ? "Decrypting..." 
                                          : (decryptedCodes.get(code.codeId) || "••••••••••••••••"))
                                      : "••••••••••••••••"
                                    }
                                  </span>
                                </div>
                                
                                {code.expirationDate && (
                                  <div className="mb-3">
                                    <div className="text-xs text-gray-500 mb-1">Expires</div>
                                    <span className="text-sm text-gray-600">{formatDate(code.expirationDate)}</span>
                                  </div>
                                )}

                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => toggleCodeVisibility(code.codeId, order.externalId)}
                                    disabled={decryptingCodes.has(code.codeId)}
                                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {decryptingCodes.has(code.codeId) ? "Decrypting..." : (visibleCodes.has(code.codeId) ? "Hide Code" : "Show Code")}
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(code.codeId, order.externalId)}
                                    className="flex-1 px-3 py-2 text-sm bg-blue text-white rounded hover:bg-blue-600 transition-colors"
                                  >
                                    Copy Code
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Important Notice */}
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="text-yellow-600 text-xl mr-3">⚠️</div>
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-1">Important Notice</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Save your codes immediately - they cannot be retrieved once this page is closed</li>
                        <li>• Codes are non-refundable once delivered</li>
                        <li>• Check expiration dates before using</li>
                        <li>• For support, contact us with your Order ID</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-1 p-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/"
                  className="px-6 py-3 bg-blue text-white rounded-md hover:bg-blue-600 transition-colors text-center"
                >
                  Continue Shopping
                </Link>
                <Link
                  href="/my-account?tab=my-codes"
                  className="px-6 py-3 border border-gray-3 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center"
                >
                  View All My Codes
                </Link>
                <Link
                  href="/my-account?tab=orders"
                  className="px-6 py-3 border border-gray-3 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center"
                >
                  View Order History
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  );
};

export default PurchaseSuccess;