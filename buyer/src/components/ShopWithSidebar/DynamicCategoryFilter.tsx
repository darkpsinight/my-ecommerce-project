"use client";
import React, { useState } from "react";
import { FilterOption } from "@/services/filters";

interface DynamicCategoryFilterProps {
  categories: FilterOption[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  loading?: boolean;
}

const DynamicCategoryFilter = ({
  categories,
  selectedCategory,
  onCategoryChange,
  loading = false
}: DynamicCategoryFilterProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-2 border border-gray-3/30 p-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue to-blue-dark rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
          </div>
          <h3 className="text-dark font-semibold">Categories</h3>
        </div>
        <svg
          className={`w-5 h-5 text-dark-3 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-2 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <>
              {/* All Categories Option */}
              <label className="flex items-center justify-between cursor-pointer group hover:bg-gray-1 p-2 rounded-lg transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === null}
                    onChange={() => onCategoryChange(null)}
                    className="w-4 h-4 text-blue border-gray-3 focus:ring-blue focus:ring-2"
                  />
                  <span className="text-gray-700 group-hover:text-blue font-medium">
                    All Categories
                  </span>
                </div>
                <span className="text-xs text-dark-3 bg-gray-2 px-2 py-1 rounded-full">
                  All
                </span>
              </label>

              {/* Category Options */}
              {categories.map((category) => (
                <label
                  key={category.value}
                  className="flex items-center justify-between cursor-pointer group hover:bg-gray-1 p-2 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category.value}
                      onChange={() => onCategoryChange(category.value)}
                      className="w-4 h-4 text-blue border-gray-3 focus:ring-blue focus:ring-2"
                    />
                    <span className="text-gray-700 group-hover:text-blue font-medium">
                      {category.label}
                    </span>
                  </div>
                  <span className="text-xs text-dark-3 bg-gray-2 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </label>
              ))}
            </>
          ) : (
            <div className="text-center py-6">
              <svg
                className="w-12 h-12 text-gray-4 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p className="text-dark-4 text-sm">No categories available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicCategoryFilter;