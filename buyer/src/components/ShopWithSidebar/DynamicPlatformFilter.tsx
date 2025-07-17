"use client";
import React, { useState } from "react";
import { FilterOption } from "@/services/filters";

interface DynamicPlatformFilterProps {
  platforms: FilterOption[];
  selectedPlatform: string | null;
  onPlatformChange: (platform: string | null) => void;
  loading?: boolean;
}

const DynamicPlatformFilter = ({
  platforms,
  selectedPlatform,
  onPlatformChange,
  loading = false
}: DynamicPlatformFilterProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-2 border border-gray-3/30 p-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green to-green-dark rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 000 2v9a2 2 0 002 2h1a1 1 0 100-2H5V6a1 1 0 000-2h10a1 1 0 100-2H4z" />
              <path d="M8 6a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1H9a1 1 0 01-1-1V6zM9 8a1 1 0 000 2h4a1 1 0 100-2H9z" />
            </svg>
          </div>
          <h3 className="text-dark font-semibold">Platforms</h3>
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
          ) : platforms.length > 0 ? (
            <>
              {/* All Platforms Option */}
              <label className="flex items-center justify-between cursor-pointer group hover:bg-gray-1 p-2 rounded-lg transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="platform"
                    checked={selectedPlatform === null}
                    onChange={() => onPlatformChange(null)}
                    className="w-4 h-4 text-green border-gray-3 focus:ring-green focus:ring-2"
                  />
                  <span className="text-dark group-hover:text-dark font-medium">
                    All Platforms
                  </span>
                </div>
                <span className="text-xs text-dark-3 bg-gray-2 px-2 py-1 rounded-full">
                  All
                </span>
              </label>

              {/* Platform Options */}
              {platforms.map((platform) => (
                <label
                  key={platform.value}
                  className="flex items-center justify-between cursor-pointer group hover:bg-gray-1 p-2 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="platform"
                      checked={selectedPlatform === platform.value}
                      onChange={() => onPlatformChange(platform.value)}
                      className="w-4 h-4 text-green border-gray-3 focus:ring-green focus:ring-2"
                    />
                    <span className="text-dark group-hover:text-green font-medium">
                      {platform.label}
                    </span>
                  </div>
                  <span className="text-xs text-dark-3 bg-gray-2 px-2 py-1 rounded-full">
                    {platform.count}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-dark-4 text-sm">No platforms available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicPlatformFilter;