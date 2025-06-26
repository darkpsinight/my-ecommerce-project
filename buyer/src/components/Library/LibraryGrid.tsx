"use client";
import React from "react";
import Link from "next/link";
import { PurchasedCode } from "@/services/orders";
import { formatDate, maskCode } from "@/utils/codeUtils";
import CopyableOrderId from "../Common/CopyableOrderId";
import ExpirationBadge from "../Common/ExpirationBadge";

interface LibraryGridProps {
  codes: PurchasedCode[];
  loading: boolean;
  viewMode: "grid" | "list";
  onCodeSelect: (code: PurchasedCode) => void;
  onCopyCode: (code: PurchasedCode) => void;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    totalOrders: number;
  };
  onPageChange: (page: number) => void;
}

const LibraryGrid: React.FC<LibraryGridProps> = ({
  codes,
  loading,
  viewMode,
  onCodeSelect,
  onCopyCode,
  pagination,
  onPageChange,
}) => {
  // Empty state
  if (!loading && codes.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-2 to-gray-3 rounded-2xl flex items-center justify-center mb-6 mx-auto">
          <svg className="w-10 h-10 text-gray-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <h3 className="text-2xl font-semibold text-dark mb-3">No Codes Found</h3>
        <p className="text-gray-6 mb-6 max-w-md mx-auto">
          Your digital library is empty. Start shopping for digital codes, game keys, and software licenses.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal to-blue text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {codes.map((code) => (
            <CodeCard
              key={code._id}
              code={code}
              onSelect={() => onCodeSelect(code)}
              onCopy={() => onCopyCode(code)}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2 border border-white/20 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-1/50 border-b border-gray-3">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-7">Product</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-7">Platform</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-7">Order ID</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-7">Purchase Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-7">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-7">Code</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-7">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code, index) => (
                  <tr 
                    key={code._id} 
                    className={`border-b border-gray-2 hover:bg-gray-1/30 transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-white/30' : 'bg-gray-1/20'
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold text-dark text-sm">{code.productName}</div>
                        <div className="text-xs text-gray-6">{code.region}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue/10 text-blue">
                        {code.platform}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <CopyableOrderId orderId={code.externalOrderId} />
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-6">{formatDate(code.purchaseDate)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <ExpirationBadge expirationDate={code.expirationDate} />
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs bg-gray-2 px-2 py-1 rounded border">
                        {maskCode(code.code)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onCodeSelect(code)}
                          className="px-3 py-1.5 text-xs bg-gradient-to-r from-teal to-blue text-white rounded-lg hover:shadow-md transition-all duration-200 font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => onCopyCode(code)}
                          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
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
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2 border border-white/20 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-6">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total} codes
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-4 py-2 text-sm border border-gray-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-1 transition-colors duration-200"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex gap-1">
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
                      onClick={() => onPageChange(pageNum)}
                      className={`px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                        pageNum === pagination.page
                          ? "bg-gradient-to-r from-teal to-blue text-white shadow-md"
                          : "border border-gray-3 hover:bg-gray-1"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2 text-sm border border-gray-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-1 transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Code Card Component for Grid View
const CodeCard: React.FC<{
  code: PurchasedCode;
  onSelect: () => void;
  onCopy: () => void;
}> = ({ code, onSelect, onCopy }) => {
  const isExpired = code.expirationDate && new Date(code.expirationDate) < new Date();
  const isExpiring = code.expirationDate && 
    new Date(code.expirationDate) > new Date() &&
    new Date(code.expirationDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2 border border-white/20 overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 group">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal to-blue p-4 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1 line-clamp-2">{code.productName}</h3>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <span>{code.platform}</span>
                <span>•</span>
                <span>{code.region}</span>
              </div>
            </div>
            {isExpired && (
              <span className="bg-red text-white text-xs px-2 py-1 rounded-full">
                Expired
              </span>
            )}
            {isExpiring && (
              <span className="bg-yellow text-yellow-dark text-xs px-2 py-1 rounded-full">
                Expiring Soon
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-6">Order ID:</span>
            <CopyableOrderId orderId={code.externalOrderId} />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-6">Purchase Date:</span>
            <span className="font-medium">{formatDate(code.purchaseDate)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-6">Expiration:</span>
            {code.expirationDate ? (
              <span className={`font-medium ${isExpired ? 'text-red' : isExpiring ? 'text-yellow-dark' : 'text-gray-7'}`}>
                {formatDate(code.expirationDate)}
              </span>
            ) : (
              <span className="font-medium text-green">Never expires</span>
            )}
          </div>
        </div>

        {/* Code Preview */}
        <div className="bg-gray-1 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-6 mb-1">Activation Code</div>
          <div className="font-mono text-sm text-dark font-semibold">
            {maskCode(code.code)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onSelect}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal to-blue text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            View Details
          </button>
          <button
            onClick={onCopy}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
            title="Copy Code"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2V5a2 2 0 00-2-2v8z" />
            </svg>
          </button>
        </div>

        {/* Order Link */}
        <Link
          href={`/orders`}
          className="block mt-3 text-center text-sm text-teal hover:text-teal-dark transition-colors duration-200"
        >
          View Order Details →
        </Link>
      </div>
    </div>
  );
};

export default LibraryGrid;