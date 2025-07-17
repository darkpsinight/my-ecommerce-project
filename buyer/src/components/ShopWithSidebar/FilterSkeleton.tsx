"use client";
import React from "react";

interface FilterSkeletonProps {
  title: string;
  itemCount?: number;
}

const FilterSkeleton = ({ title, itemCount = 5 }: FilterSkeletonProps) => {
  return (
    <div className="bg-white rounded-xl shadow-2 border border-gray-3/30 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-2 rounded-lg animate-pulse"></div>
          <div className="h-4 bg-gray-2 rounded w-24 animate-pulse"></div>
        </div>
        <div className="w-5 h-5 bg-gray-2 rounded animate-pulse"></div>
      </div>

      <div className="space-y-3">
        {[...Array(itemCount)].map((_, index) => (
          <div key={index} className="flex items-center justify-between p-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-gray-2 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-2 rounded w-20 animate-pulse"></div>
            </div>
            <div className="w-6 h-4 bg-gray-2 rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterSkeleton;