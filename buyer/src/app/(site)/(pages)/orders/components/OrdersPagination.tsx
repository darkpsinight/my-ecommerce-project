"use client";
import React from "react";

interface OrdersPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const OrdersPagination: React.FC<OrdersPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex justify-center mt-12">
      <div className="bg-white rounded-2xl shadow-3 border border-gray-3 p-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={handlePrevious}
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
            onClick={handleNext}
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
  );
};

export default OrdersPagination;