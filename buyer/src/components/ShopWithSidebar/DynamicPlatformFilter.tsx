"use client";
import React, { useState } from "react";
import { FilterOption } from "@/services/filters";
import { FiMonitor, FiChevronDown, FiSmartphone } from "react-icons/fi";

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
  loading = false,
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
            <FiMonitor className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-dark font-semibold">Platforms</h3>
        </div>
        <FiChevronDown
          className={`w-5 h-5 text-dark-3 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
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
                  <span className="text-gray-700 group-hover:text-green font-medium">
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
                    <span className="text-gray-700 group-hover:text-green font-medium">
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
              <FiSmartphone className="w-12 h-12 text-gray-4 mx-auto mb-3" />
              <p className="text-dark-4 text-sm">No platforms available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicPlatformFilter;
