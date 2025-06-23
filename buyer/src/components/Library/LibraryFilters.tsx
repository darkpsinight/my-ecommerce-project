"use client";
import React, { useState } from "react";

interface LibraryFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  platforms: string[];
  selectedPlatform: string;
  selectedExpiration: string;
  onFilterChange: (type: string, value: string) => void;
  sortBy: "createdAt" | "productName" | "platform";
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: "createdAt" | "productName" | "platform", sortOrder?: "asc" | "desc") => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
}

const LibraryFilters: React.FC<LibraryFiltersProps> = ({
  searchTerm,
  onSearchChange,
  platforms,
  selectedPlatform,
  selectedExpiration,
  onFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
}) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="mb-8">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2 border border-white/20 overflow-hidden">
        
        {/* Main Filter Bar */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search */}
            <div className="flex-1">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by product name, platform, or order ID..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm"
                />
              </form>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              
              {/* View Mode Toggle */}
              <div className="flex bg-gray-1 rounded-lg p-1">
                <button
                  onClick={() => onViewModeChange("grid")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-teal"
                      : "text-gray-5 hover:text-gray-7"
                  }`}
                  title="Grid View"
                >
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => onViewModeChange("list")}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-teal"
                      : "text-gray-5 hover:text-gray-7"
                  }`}
                  title="List View"
                >
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Filters Toggle */}
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  isFiltersOpen
                    ? "bg-gradient-to-r from-teal to-blue text-white shadow-lg"
                    : "bg-gray-1 text-gray-6 hover:bg-gray-2"
                }`}
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                Filters
                {(selectedPlatform || selectedExpiration) && (
                  <span className="bg-yellow text-yellow-dark text-xs px-2 py-0.5 rounded-full ml-1">
                    {[selectedPlatform, selectedExpiration].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {isFiltersOpen && (
          <div className="border-t border-gray-3 bg-gray-1/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Platform Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-7 mb-2">Platform</label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => onFilterChange("platform", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent bg-white"
                >
                  <option value="">All Platforms</option>
                  {platforms.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>

              {/* Expiration Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-7 mb-2">Expiration Status</label>
                <select
                  value={selectedExpiration}
                  onChange={(e) => onFilterChange("expiration", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent bg-white"
                >
                  <option value="">All Codes</option>
                  <option value="never_expires">Never Expires</option>
                  <option value="expiring">Expiring Soon (7 days)</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-7 mb-2">Sort By</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split("-") as [typeof sortBy, typeof sortOrder];
                    onSortChange(newSortBy, newSortOrder);
                  }}
                  className="w-full px-3 py-2 border border-gray-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent bg-white"
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

            {/* Clear Filters */}
            {(selectedPlatform || selectedExpiration) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    onFilterChange("platform", "");
                    onFilterChange("expiration", "");
                  }}
                  className="text-sm text-red hover:text-red-dark font-medium transition-colors duration-200"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryFilters;