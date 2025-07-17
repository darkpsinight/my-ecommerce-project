"use client";
import React, { useState, useEffect, useCallback } from "react";
import { PriceRange } from "@/services/filters";

interface DynamicPriceRangeFilterProps {
  priceRange: PriceRange;
  selectedRange: [number, number];
  onRangeChange: (range: [number, number]) => void;
  loading?: boolean;
}

const DynamicPriceRangeFilter = ({
  priceRange,
  selectedRange,
  onRangeChange,
  loading = false
}: DynamicPriceRangeFilterProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [localRange, setLocalRange] = useState<[number, number]>(selectedRange);
  const [isDragging, setIsDragging] = useState(false);

  // Update local range when props change
  useEffect(() => {
    setLocalRange(selectedRange);
  }, [selectedRange]);

  // Apply changes only when Apply button is clicked
  const applyPriceRange = () => {
    onRangeChange(localRange);
  };

  const resetRange = () => {
    const resetRange: [number, number] = [priceRange.min, priceRange.max];
    setLocalRange(resetRange);
    onRangeChange(resetRange);
  };

  const isRangeModified = localRange[1] !== selectedRange[1];

  return (
    <div className="bg-white rounded-xl shadow-2 border border-gray-3/30 p-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange to-orange-dark rounded-lg flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-dark font-semibold">Price Range</h3>
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
        <div className="mt-4">
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-2 rounded w-full"></div>
              <div className="h-8 bg-gray-2 rounded w-full"></div>
              <div className="flex gap-3">
                <div className="h-10 bg-gray-2 rounded flex-1"></div>
                <div className="h-10 bg-gray-2 rounded flex-1"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Range Display */}
              <div className="flex items-center justify-between">
                <span className="text-dark text-lg font-semibold">
                  Up to ${localRange[1]}
                </span>
                {isRangeModified && (
                  <button
                    onClick={resetRange}
                    className="text-xs text-blue hover:text-blue-dark bg-blue-light-5 hover:bg-blue-light-4 px-3 py-1 rounded-full transition-colors duration-200"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Single Range Slider for Max Price */}
              <div className="relative">
                <div className="relative h-3 bg-gray-2 rounded-full">
                  {/* Active range track */}
                  <div
                    className="absolute h-3 bg-gradient-to-r from-orange to-orange-dark rounded-full transition-all duration-200"
                    style={{
                      left: `0%`,
                      width: `${((localRange[1] - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`
                    }}
                  />
                  
                  {/* Single range slider for max value */}
                  <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    step="0.01"
                    value={localRange[1]}
                    onChange={(e) => {
                      const newMaxValue = Number(e.target.value);
                      setLocalRange([priceRange.min, newMaxValue]);
                      // Don't auto-apply changes, wait for Apply button
                    }}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    className="absolute inset-0 w-full h-3 bg-transparent appearance-none cursor-pointer range-slider-orange"
                  />
                </div>

                {/* Range labels */}
                <div className="flex justify-between mt-2 text-xs text-dark">
                  <span>${priceRange.min}</span>
                  <span>${priceRange.max}</span>
                </div>
              </div>

              {/* Manual Input Field */}
              <div className="w-full">
                <label className="block text-xs font-medium text-dark mb-1">
                  Maximum Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    min={priceRange.min}
                    max={priceRange.max}
                    value={localRange[1]}
                    onChange={(e) => {
                      const newMaxValue = Number(e.target.value);
                      setLocalRange([priceRange.min, newMaxValue]);
                      // Don't auto-apply changes, wait for Apply button
                    }}
                    className="w-full pl-6 pr-3 py-2 border border-gray-3 rounded-lg focus:ring-2 focus:ring-orange focus:border-orange text-sm"
                  />
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={applyPriceRange}
                disabled={!isRangeModified}
                className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isRangeModified
                    ? "bg-gradient-to-r from-orange to-orange-dark text-white hover:shadow-lg transform hover:scale-105"
                    : "bg-gray-2 text-dark-4 cursor-not-allowed"
                }`}
              >
                {isDragging ? "Adjusting..." : "Apply Price Range"}
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .range-slider-orange {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          outline: none;
        }

        .range-slider-orange::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F27430, #E1580E);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 12px rgba(242, 116, 48, 0.3), 0 1px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .range-slider-orange::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 16px rgba(242, 116, 48, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .range-slider-orange::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #F27430, #E1580E);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 12px rgba(242, 116, 48, 0.3), 0 1px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          -moz-appearance: none;
        }

        .range-slider-orange::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 16px rgba(242, 116, 48, 0.4), 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .range-slider-orange::-moz-range-track {
          background: transparent;
          border: none;
        }

        .range-slider-orange::-webkit-slider-track {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default DynamicPriceRangeFilter;