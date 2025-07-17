"use client";
import React, { useState } from "react";
import { FilterOption } from "@/services/filters";
import { FiGlobe, FiChevronDown, FiMapPin } from "react-icons/fi";

interface DynamicRegionFilterProps {
  regions: FilterOption[];
  selectedRegion: string | null;
  onRegionChange: (region: string | null) => void;
  loading?: boolean;
}

const DynamicRegionFilter = ({
  regions,
  selectedRegion,
  onRegionChange,
  loading = false
}: DynamicRegionFilterProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white rounded-xl shadow-2 border border-gray-3/30 p-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple to-purple-dark rounded-lg flex items-center justify-center">
            <FiGlobe className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-dark font-semibold">Regions</h3>
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
          ) : regions.length > 0 ? (
            <>
              {/* All Regions Option */}
              <label className="flex items-center justify-between cursor-pointer group hover:bg-gray-1 p-2 rounded-lg transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="region"
                    checked={selectedRegion === null}
                    onChange={() => onRegionChange(null)}
                    className="w-4 h-4 text-purple border-gray-3 focus:ring-purple focus:ring-2"
                  />
                  <span className="text-gray-700 group-hover:text-purple font-medium">
                    All Regions
                  </span>
                </div>
                <span className="text-xs text-dark-3 bg-gray-2 px-2 py-1 rounded-full">
                  All
                </span>
              </label>

              {/* Region Options */}
              {regions.map((region) => (
                <label
                  key={region.value}
                  className="flex items-center justify-between cursor-pointer group hover:bg-gray-1 p-2 rounded-lg transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="region"
                      checked={selectedRegion === region.value}
                      onChange={() => onRegionChange(region.value)}
                      className="w-4 h-4 text-purple border-gray-3 focus:ring-purple focus:ring-2"
                    />
                    <span className="text-gray-700 group-hover:text-purple font-medium">
                      {region.label}
                    </span>
                  </div>
                  <span className="text-xs text-dark-3 bg-gray-2 px-2 py-1 rounded-full">
                    {region.count}
                  </span>
                </label>
              ))}
            </>
          ) : (
            <div className="text-center py-6">
              <FiMapPin className="w-12 h-12 text-gray-4 mx-auto mb-3" />
              <p className="text-dark-4 text-sm">No regions available</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DynamicRegionFilter;