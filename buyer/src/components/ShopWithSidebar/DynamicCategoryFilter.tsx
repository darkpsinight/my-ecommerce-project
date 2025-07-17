"use client";
import React, { useState } from "react";
import { FilterOption } from "@/services/filters";
import { FiTag, FiChevronDown, FiPackage } from "react-icons/fi";

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
            <FiTag className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-dark font-semibold">Categories</h3>
        </div>
        <FiChevronDown className={`w-5 h-5 text-dark-3 transition-transform duration-200 ${
          isOpen ? "rotate-180" : ""
        }`} />
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
              <FiPackage className="w-12 h-12 text-gray-4 mx-auto mb-3" />
              <p className="text-dark-4 text-sm">No categories available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicCategoryFilter;