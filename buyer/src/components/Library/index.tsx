"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import Link from "next/link";
import { IoLibrary } from "react-icons/io5";
import { ordersApi, PurchasedCode, GetPurchasedCodesParams } from "@/services/orders";
import { toast } from "react-hot-toast";
import { 
  getCodeExpirationInfo, 
  maskCode, 
  copyToClipboard as copyToClipboardUtil,
  formatDate,
  formatCurrency 
} from "@/utils/codeUtils";

import PageContainer from "../Common/PageContainer";
import ProtectedRoute from "../Common/ProtectedRoute";
import CopyableOrderId from "../Common/CopyableOrderId";
import LibraryGrid from "./LibraryGrid";
import LibraryFilters from "./LibraryFilters";
import LibraryStats from "./LibraryStats";
import GiftManagement from "./GiftManagement";
import CodeModal from "./CodeModal";
import { FaGift } from "react-icons/fa";

const Library = () => {
  const { token } = useSelector((state: any) => state.authReducer);
  const [codes, setCodes] = useState<PurchasedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
    totalOrders: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "productName" | "platform">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterPlatform, setFilterPlatform] = useState<string>("");
  const [filterExpiration, setFilterExpiration] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCode, setSelectedCode] = useState<PurchasedCode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<"codes" | "gifts">("codes");

  // Get verify token to check if user has valid session
  const getVerifyToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('verifyToken');
    }
    return null;
  };

  // Check if user is authenticated
  const isAuthenticated = useCallback((): boolean => {
    return !!(token || getVerifyToken());
  }, [token]);

  // Fetch codes
  const fetchCodes = useCallback(async (params?: Partial<GetPurchasedCodesParams>) => {
    if (!isAuthenticated()) {
      setError("Please sign in to view your digital library");
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
      
      if (error.response?.status === 401) {
        setError("Please sign in to view your digital library");
      } else {
        setError(error.message || "Failed to load your digital library");
        if (error.response?.status !== 401) {
          toast.error("Failed to load your digital library");
        }
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, sortBy, sortOrder, isAuthenticated]);

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (type: string, value: string) => {
    if (type === "platform") {
      setFilterPlatform(value);
    } else if (type === "expiration") {
      setFilterExpiration(value);
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle sort change
  const handleSortChange = (newSortBy: typeof sortBy, newSortOrder?: typeof sortOrder) => {
    setSortBy(newSortBy);
    if (newSortOrder) setSortOrder(newSortOrder);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Open code modal
  const openCodeModal = (code: PurchasedCode) => {
    setSelectedCode(code);
    setIsModalOpen(true);
  };

  // Close code modal
  const closeCodeModal = () => {
    setIsModalOpen(false);
    setSelectedCode(null);
  };

  // Copy code to clipboard
  const copyToClipboard = async (code: PurchasedCode) => {
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

  // Initial load
  useEffect(() => {
    if (isAuthenticated() && activeSection === "codes") {
      fetchCodes();
    }
  }, [fetchCodes, isAuthenticated, activeSection]);

  // Filter codes based on selected filters
  const filteredCodes = codes.filter(code => {
    if (filterPlatform && code.platform !== filterPlatform) return false;
    if (filterExpiration === "expired" && (!code.expirationDate || new Date(code.expirationDate) > new Date())) return false;
    if (filterExpiration === "expiring" && (!code.expirationDate || new Date(code.expirationDate) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))) return false;
    if (filterExpiration === "never_expires" && code.expirationDate) return false;
    return true;
  });

  // Get unique platforms for filter
  const platforms = Array.from(new Set(codes.map(code => code.platform)));

  return (
    <ProtectedRoute
      redirectMessage="Please sign in to access your digital library and manage your purchased codes."
      redirectButtonText="Sign In to Library"
    >
      <PageContainer fullWidth={true}>
        <section className="min-h-screen pt-[120px] pb-20 bg-gradient-to-br from-blue-light-5 via-white to-teal/10">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6">
            
            {/* Header Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-teal to-blue rounded-2xl mb-6 shadow-lg">
                <IoLibrary className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal to-blue-dark bg-clip-text text-transparent mb-4">
                Digital Library
              </h1>
              <p className="text-lg text-gray-6 max-w-2xl mx-auto">
                Access your complete collection of digital codes, game keys, and software licenses with detailed purchase history and seller information.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-2">
                <button
                  onClick={() => setActiveSection("codes")}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeSection === "codes"
                      ? "bg-gradient-to-r from-teal to-blue text-white shadow-lg"
                      : "text-gray-6 hover:text-gray-7 hover:bg-gray-1"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    My Codes
                  </div>
                </button>
                <button
                  onClick={() => setActiveSection("gifts")}
                  className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeSection === "gifts"
                      ? "bg-gradient-to-r from-yellow to-orange text-white shadow-lg"
                      : "text-gray-6 hover:text-gray-7 hover:bg-gray-1"
                  }`}
                >
                  <div className="flex items-center gap-2">
                  <FaGift className="w-5 h-5"/>
                    Gift Management
                    <span className="text-xs bg-yellow-light-2 text-yellow-dark px-2 py-0.5 rounded-full ml-1">
                      Coming Soon
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Content based on active section */}
            {activeSection === "codes" ? (
              <>
                {/* Stats Section */}
                <LibraryStats 
                  totalCodes={pagination.total}
                  totalOrders={pagination.totalOrders}
                  platforms={platforms}
                  codes={codes}
                />

                {/* Filters and Controls */}
                <LibraryFilters
                  searchTerm={searchTerm}
                  onSearchChange={handleSearch}
                  platforms={platforms}
                  selectedPlatform={filterPlatform}
                  selectedExpiration={filterExpiration}
                  onFilterChange={handleFilterChange}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSortChange={handleSortChange}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                {/* Loading State */}
                {loading && codes.length === 0 && (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal mb-4"></div>
                      <p className="text-gray-6 font-medium">Loading your digital library...</p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {error && codes.length === 0 && (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-light-5 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <svg className="w-8 h-8 text-red" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-dark mb-2">Unable to Load Library</h3>
                      <p className="text-gray-6 mb-4">{error}</p>
                      <button
                        onClick={() => fetchCodes()}
                        className="px-6 py-3 bg-gradient-to-r from-teal to-blue text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}

                {/* Codes Grid/List */}
                {!loading && !error && (
                  <LibraryGrid
                    codes={filteredCodes}
                    loading={loading}
                    viewMode={viewMode}
                    onCodeSelect={openCodeModal}
                    onCopyCode={copyToClipboard}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                )}

                {/* Code Modal */}
                <CodeModal 
                  isOpen={isModalOpen} 
                  closeModal={closeCodeModal} 
                  code={selectedCode} 
                />
              </>
            ) : (
              <GiftManagement />
            )}
            
          </div>
        </section>
      </PageContainer>
    </ProtectedRoute>
  );
};

export default Library;