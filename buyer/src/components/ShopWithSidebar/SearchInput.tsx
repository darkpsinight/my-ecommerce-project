"use client";
import React, { useState, useEffect, useCallback } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
}

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search products...",
  loading = false
}: SearchInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  // Update local value when props change
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Remove auto-search while typing
  };

  const handleSearch = () => {
    onChange(localValue);
  };

  const clearSearch = () => {
    setLocalValue("");
    onChange("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onChange(localValue);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-light-5 to-green-light-6 rounded-xl p-5 border border-blue-light-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue to-green rounded-lg flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-dark font-semibold">Search Products</h3>
      </div>

      <div className="relative">
        <button
          onClick={handleSearch}
          disabled={loading || !localValue.trim()}
          className={`absolute inset-y-0 left-0 pl-4 flex items-center transition-colors duration-200 ${
            loading || !localValue.trim() 
              ? "cursor-not-allowed" 
              : "cursor-pointer hover:text-blue"
          }`}
        >
          <svg
            className={`w-5 h-5 transition-colors duration-200 ${
              loading ? "text-blue animate-spin" : 
              !localValue.trim() ? "text-dark-4" : "text-blue hover:text-blue-dark"
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {loading ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            )}
          </svg>
        </button>

        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          className={`w-full pl-12 pr-12 py-3 bg-white border border-gray-3 rounded-xl focus:ring-2 focus:ring-blue/20 focus:border-blue transition-all duration-200 placeholder-dark-4 ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        />

        {localValue && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-dark-4 hover:text-red transition-colors duration-200"
            disabled={loading}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {localValue && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green rounded-full"></div>
          <span className="text-dark-3">
            {loading ? "Searching..." : `Searching for "${localValue}"`}
          </span>
        </div>
      )}
    </div>
  );
};

export default SearchInput;