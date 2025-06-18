"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { ordersApi, PurchasedCode, GetPurchasedCodesParams } from "@/services/orders";
import { toast } from "react-hot-toast";
import { 
  getCodeExpirationInfo, 
  getExpirationBadge, 
  maskCode, 
  copyToClipboard as copyToClipboardUtil,
  formatDate,
  formatCurrency 
} from "@/utils/codeUtils";
import CopyableOrderId from "@/components/Common/CopyableOrderId";

interface MyCodesProps {
  className?: string;
  isActive?: boolean;
}

const MyCodes: React.FC<MyCodesProps> = ({ className = "", isActive = false }) => {
  const { token } = useSelector((state: any) => state.authReducer);
  const [codes, setCodes] = useState<PurchasedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    totalOrders: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "productName" | "platform">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [visibleCodes, setVisibleCodes] = useState<Set<string>>(new Set());
  const [authReady, setAuthReady] = useState(false);
  const [hasEverBeenActive, setHasEverBeenActive] = useState(false);

  // Get verify token to check if user has valid session
  const getVerifyToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('verifyToken');
    }
    return null;
  };

  // Check if user is authenticated (has either token or verifyToken for refresh)
  const isAuthenticated = (): boolean => {
    return !!(token || getVerifyToken());
  };

  // Wait for auth state to be ready
  useEffect(() => {
    // If we have a token, we're ready
    if (token) {
      setAuthReady(true);
      return;
    }

    // If we have verifyToken, wait a bit for token refresh to happen
    if (getVerifyToken()) {
      const timer = setTimeout(() => {
        setAuthReady(true);
      }, 1000); // Wait 1 second for token refresh to complete

      return () => clearTimeout(timer);
    }

    // If no auth tokens at all, we're ready (will show unauthenticated state)
    setAuthReady(true);
  }, [token]);



  // Toggle code visibility
  const toggleCodeVisibility = (codeId: string, code: PurchasedCode) => {
    const newVisibleCodes = new Set(visibleCodes);
    if (newVisibleCodes.has(codeId)) {
      newVisibleCodes.delete(codeId);
    } else {
      newVisibleCodes.add(codeId);
    }
    setVisibleCodes(newVisibleCodes);
  };

  // Copy code to clipboard
  const copyToClipboard = async (codeId: string, code: PurchasedCode) => {
    try {
      const success = await copyToClipboardUtil(code.code, "Code copied to clipboard!");
      if (success) {
        toast.success("Code copied to clipboard!");
      } else {
        toast.error("Failed to copy code");
      }
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Failed to copy code");
    }
  };

  // Fetch codes
  const fetchCodes = async (params?: Partial<GetPurchasedCodesParams>) => {
    // Don't fetch if not authenticated
    if (!isAuthenticated()) {
      setError("Please sign in to view your purchased codes");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const queryParams: GetPurchasedCodesParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        sortBy,
        sortOrder,
        ...params,
      };

      const response = await ordersApi.getBuyerPurchasedCodes(queryParams);

      if (response.success) {
        setCodes(response.data.codes);
        setPagination(response.data.pagination);
      } else {
        throw new Error("Failed to fetch codes");
      }
    } catch (error: any) {
      console.error("Error fetching codes:", error);
      
      // Check if it's an auth error
      if (error.response?.status === 401) {
        setError("Please sign in to view your purchased codes");
      } else {
        setError(error.message || "Failed to load purchased codes");
        // Only show toast for non-auth errors to avoid double error display
        if (error.response?.status !== 401) {
          toast.error("Failed to load purchased codes");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCodes({ page: 1, search: searchTerm });
  };

  // Handle sort change
  const handleSortChange = (newSortBy: typeof sortBy, newSortOrder?: typeof sortOrder) => {
    setSortBy(newSortBy);
    if (newSortOrder) setSortOrder(newSortOrder);
    fetchCodes({ page: 1, sortBy: newSortBy, sortOrder: newSortOrder || sortOrder });
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      fetchCodes({ page: newPage });
    }
  };

  // Track when tab becomes active for the first time
  useEffect(() => {
    if (isActive && !hasEverBeenActive) {
      setHasEverBeenActive(true);
    }
  }, [isActive, hasEverBeenActive]);

  // Initial load - wait for auth to be ready and tab to be active
  useEffect(() => {
    if (authReady && hasEverBeenActive) {
      fetchCodes();
    }
  }, [authReady, hasEverBeenActive]);

  // Show loading state only when actually loading (not when tab hasn't been activated)
  if (!hasEverBeenActive && codes.length === 0) {
    return (
      <div className={`${className} p-6`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center text-center">
            <div className="text-gray-400 text-4xl mb-4">🔑</div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Your Digital Codes</h3>
            <p className="text-gray-500">
              View and manage your purchased digital codes here
            </p>
          </div>
        </div>
      </div>
    );
  }

  if ((!authReady || loading) && codes.length === 0) {
    return (
      <div className={`${className} p-6`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
            <p className="mt-4 text-gray-600">
              {!authReady ? "Authenticating..." : "Loading your codes..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && codes.length === 0) {
    return (
      <div className={`${className} p-6`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={() => fetchCodes()}
              className="mt-4 px-4 py-2 bg-blue text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-dark mb-1">My Purchased Codes</h2>
              <p className="text-sm text-gray-600">
                {pagination.total} codes from {pagination.totalOrders} orders
              </p>
            </div>

            {/* Search and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="Search by product, platform..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-3 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue text-white rounded-r-md hover:bg-blue-600 transition-colors"
                >
                  Search
                </button>
              </form>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split("-") as [typeof sortBy, typeof sortOrder];
                  handleSortChange(newSortBy, newSortOrder);
                }}
                className="px-3 py-2 border border-gray-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="productName-asc">Product A-Z</option>
                <option value="productName-desc">Product Z-A</option>
                <option value="platform-asc">Platform A-Z</option>
                <option value="platform-desc">Platform Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Codes List */}
        <div className="p-6">
          {codes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No codes found</h3>
              <p className="text-gray-500">
                {searchTerm ? "Try adjusting your search terms" : "You haven't purchased any codes yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-3">
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Product</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Order ID</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Purchase Date</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Expiration</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Activation Code</th>
                        <th className="text-left py-3 px-2 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((code) => (
                        <tr key={code._id} className="border-b border-gray-1 hover:bg-gray-50">
                          <td className="py-4 px-2">
                            <div>
                              <div className="font-medium text-dark">{code.productName}</div>
                              <div className="text-sm text-gray-600">
                                {code.platform} • {code.region}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <CopyableOrderId orderId={code.externalOrderId} />
                          </td>
                          <td className="py-4 px-2">
                            <span className="text-sm text-gray-600">{formatDate(code.purchaseDate)}</span>
                          </td>
                          <td className="py-4 px-2">
                            {code.expirationDate ? (
                              <span className="text-sm text-gray-600">{formatDate(code.expirationDate)}</span>
                            ) : (
                              <span className="text-sm text-green-600 font-medium">Never expires</span>
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded border">
                                {visibleCodes.has(code._id) ? code.code : maskCode(code.code)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => toggleCodeVisibility(code._id, code)}
                                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                              >
                                {visibleCodes.has(code._id) ? "Hide" : "Show"}
                              </button>
                              <button
                                onClick={() => copyToClipboard(code._id, code)}
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

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {codes.map((code) => (
                  <div key={code._id} className="border border-gray-3 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-dark mb-1">{code.productName}</h3>
                        <p className="text-sm text-gray-600">{code.platform} • {code.region}</p>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">{formatDate(code.purchaseDate)}</span>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Order ID</div>
                      <CopyableOrderId orderId={code.externalOrderId} />
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">Expiration</div>
                      {code.expirationDate ? (
                        <span className="text-sm text-gray-600">{formatDate(code.expirationDate)}</span>
                      ) : (
                        <span className="text-sm text-green-600 font-medium">Never expires</span>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2">Activation Code</div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded border flex-1">
                          {visibleCodes.has(code._id) ? code.code : maskCode(code.code)}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleCodeVisibility(code._id, code)}
                        className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        {visibleCodes.has(code._id) ? "Hide Code" : "Show Code"}
                      </button>
                      <button
                        onClick={() => copyToClipboard(code._id, code)}
                        className="flex-1 px-3 py-2 text-sm bg-blue text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-3">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} codes
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-2 text-sm border border-gray-3 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm rounded ${
                              pageNum === pagination.page
                                ? "bg-blue text-white"
                                : "border border-gray-3 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="px-3 py-2 text-sm border border-gray-3 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue"></div>
            <span>Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCodes;