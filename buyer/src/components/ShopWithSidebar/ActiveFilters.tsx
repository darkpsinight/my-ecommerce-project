"use client";
import React from "react";
import { FilterOptions } from "@/services/filters";

interface ActiveFiltersProps {
  filterOptions: FilterOptions | null;
  selectedCategory: string | null;
  selectedPlatform: string | null;
  selectedRegion: string | null;
  priceRange: [number, number];
  searchQuery: string;
  onClearCategory: () => void;
  onClearPlatform: () => void;
  onClearRegion: () => void;
  onClearPriceRange: () => void;
  onClearSearch: () => void;
  onClearAll: () => void;
}

const ActiveFilters = ({
  filterOptions,
  selectedCategory,
  selectedPlatform,
  selectedRegion,
  priceRange,
  searchQuery,
  onClearCategory,
  onClearPlatform,
  onClearRegion,
  onClearPriceRange,
  onClearSearch,
  onClearAll
}: ActiveFiltersProps) => {
  // Helper to get category name
  const getCategoryName = (categoryId: string) => {
    return filterOptions?.categories.find(cat => cat.value === categoryId)?.label || categoryId;
  };

  // Helper to get platform name
  const getPlatformName = (platform: string) => {
    return filterOptions?.platforms.find(plat => plat.value === platform)?.label || platform;
  };

  // Helper to get region name
  const getRegionName = (region: string) => {
    return filterOptions?.regions.find(reg => reg.value === region)?.label || region;
  };

  // Check if price range is modified (only checking max price since min is always the lowest)
  const isPriceRangeModified = filterOptions && 
    (priceRange[1] !== filterOptions.priceRange.max);

  // Count active filters
  const activeFiltersCount = [
    selectedCategory,
    selectedPlatform,
    selectedRegion,
    isPriceRangeModified,
    searchQuery.trim()
  ].filter(Boolean).length;

  if (activeFiltersCount === 0) {
    return null;
  }

  return (
    <div className="bg-blue-light-5 border border-blue-light-4 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue rounded-lg flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
          </div>
          <h3 className="text-dark font-semibold">
            Active Filters ({activeFiltersCount})
          </h3>
        </div>
        <button
          onClick={onClearAll}
          className="text-blue-dark hover:text-blue text-sm font-medium px-3 py-1 rounded-lg hover:bg-white/50 transition-all duration-200"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Search Filter */}
        {searchQuery.trim() && (
          <div className="inline-flex items-center gap-2 bg-white border border-blue-light-3 rounded-lg px-3 py-2 text-sm">
            <svg
              className="w-4 h-4 text-blue"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <span className="text-dark">
              Search: <strong>{searchQuery}</strong>
            </span>
            <button
              onClick={onClearSearch}
              className="text-dark-4 hover:text-red transition-colors duration-200"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Category Filter */}
        {selectedCategory && (
          <div className="inline-flex items-center gap-2 bg-white border border-blue-light-3 rounded-lg px-3 py-2 text-sm">
            <svg
              className="w-4 h-4 text-blue"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span className="text-dark">
              Category: <strong>{getCategoryName(selectedCategory)}</strong>
            </span>
            <button
              onClick={onClearCategory}
              className="text-dark-4 hover:text-red transition-colors duration-200"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Platform Filter */}
        {selectedPlatform && (
          <div className="inline-flex items-center gap-2 bg-white border border-green-light-4 rounded-lg px-3 py-2 text-sm">
            <svg
              className="w-4 h-4 text-green"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 000 2v9a2 2 0 002 2h1a1 1 0 100-2H5V6a1 1 0 000-2h10a1 1 0 100-2H4z" />
              <path d="M8 6a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1H9a1 1 0 01-1-1V6zM9 8a1 1 0 000 2h4a1 1 0 100-2H9z" />
            </svg>
            <span className="text-dark">
              Platform: <strong>{getPlatformName(selectedPlatform)}</strong>
            </span>
            <button
              onClick={onClearPlatform}
              className="text-dark-4 hover:text-red transition-colors duration-200"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Region Filter */}
        {selectedRegion && (
          <div className="inline-flex items-center gap-2 bg-white border border-purple-light rounded-lg px-3 py-2 text-sm">
            <svg
              className="w-4 h-4 text-purple"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
            </svg>
            <span className="text-dark">
              Region: <strong>{getRegionName(selectedRegion)}</strong>
            </span>
            <button
              onClick={onClearRegion}
              className="text-dark-4 hover:text-red transition-colors duration-200"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Price Range Filter */}
        {isPriceRangeModified && (
          <div className="inline-flex items-center gap-2 bg-white border border-orange rounded-lg px-3 py-2 text-sm">
            <svg
              className="w-4 h-4 text-orange"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            <span className="text-dark">
              Price: <strong>Up to ${priceRange[1]}</strong>
            </span>
            <button
              onClick={onClearPriceRange}
              className="text-dark-4 hover:text-red transition-colors duration-200"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveFilters;