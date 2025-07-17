"use client";
import React, { useState, useRef, useEffect } from "react";

export interface SortOption {
  label: string;
  value: string;
}

interface SortingSelectProps {
  options: SortOption[];
  selectedValue: string;
  onSortChange: (value: string) => void;
  loading?: boolean;
}

const SortingSelect = ({
  options,
  selectedValue,
  onSortChange,
  loading = false
}: SortingSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === selectedValue) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    onSortChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={selectRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`flex items-center justify-between gap-3 bg-white border border-gray-3 rounded-xl px-4 py-3 min-w-[200px] text-left transition-all duration-200 hover:border-blue focus:ring-2 focus:ring-blue/20 focus:border-blue ${
          loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-br from-blue to-blue-dark rounded-lg flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
          </div>
          <span className="text-dark font-medium">
            {loading ? "Loading..." : selectedOption?.label}
          </span>
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

      {isOpen && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-3 rounded-xl shadow-2 z-50 overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-gray-1 flex items-center gap-3 ${
                  selectedValue === option.value ? "bg-blue-light-5 text-blue-dark" : "text-dark-2"
                }`}
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center">
                  {selectedValue === option.value ? (
                    <svg
                      className="w-4 h-4 text-blue"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="w-3 h-3 border border-gray-4 rounded-full"></div>
                  )}
                </div>
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortingSelect;