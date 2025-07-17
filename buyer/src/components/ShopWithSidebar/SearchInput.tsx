"use client";
import React, { useState, useEffect } from "react";
import { FiSearch, FiX, FiLoader } from "react-icons/fi";

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
  loading = false,
}: SearchInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  // Update local value when props change
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    // Debounced search while typing (optional - can be enabled for better UX)
    // onChange(newValue);
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
          <FiSearch className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-dark font-semibold">Search Products</h3>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="text"
            value={localValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={loading}
            className={`w-full pl-4 pr-10 py-3 bg-white border-0 rounded-xl focus:ring-2 focus:ring-blue/20 focus:outline-none transition-all duration-200 placeholder-dark-4 shadow-sm ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />

          {localValue && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-dark-4 hover:text-red transition-colors duration-200"
              disabled={loading}
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !localValue.trim()}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            loading || !localValue.trim()
              ? "bg-gray-2 text-dark-4 cursor-not-allowed"
              : "bg-gradient-to-r from-blue to-blue-dark text-white hover:shadow-lg transform hover:scale-105"
          }`}
        >
          {loading ? (
            <FiLoader className="w-5 h-5 animate-spin" />
          ) : (
            <FiSearch className="w-5 h-5" />
          )}
          <span>{loading ? "Searching..." : "Search Products"}</span>
        </button>
      </div>


    </div>
  );
};

export default SearchInput;
