"use client";
import React from "react";

interface SellerCardSkeletonProps {
  gridView?: boolean;
}

const SellerCardSkeleton: React.FC<SellerCardSkeletonProps> = ({ gridView = true }) => {
  if (gridView) {
    return (
      <div className="animate-pulse">
        <div className="overflow-hidden rounded-xl bg-white shadow-1 border border-gray-3/20">
          {/* Banner */}
          <div className="relative h-24 bg-gray-2">
            {/* Profile Image */}
            <div className="absolute -bottom-8 left-4">
              <div className="w-16 h-16 rounded-full border-4 border-white bg-gray-2"></div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 pt-10">
            {/* Title */}
            <div className="h-5 bg-gray-2 rounded mb-2"></div>
            
            {/* Subtitle */}
            <div className="h-4 bg-gray-2 rounded w-3/4 mb-3"></div>
            
            {/* Description */}
            <div className="space-y-2 mb-3">
              <div className="h-3 bg-gray-2 rounded"></div>
              <div className="h-3 bg-gray-2 rounded w-2/3"></div>
            </div>
            
            {/* Stats */}
            <div className="flex justify-between mb-3">
              <div className="h-3 bg-gray-2 rounded w-20"></div>
              <div className="h-3 bg-gray-2 rounded w-16"></div>
            </div>
            
            {/* Button */}
            <div className="h-8 bg-gray-2 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      <div className="overflow-hidden rounded-xl bg-white shadow-1 border border-gray-3/20">
        <div className="flex gap-6 p-6">
          {/* Left Section */}
          <div className="flex-shrink-0">
            <div className="w-24 h-16 bg-gray-2 rounded-lg mb-2"></div>
            <div className="w-20 h-20 bg-gray-2 rounded-full mx-auto -mt-8 relative z-10"></div>
          </div>

          {/* Middle Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="h-6 bg-gray-2 rounded mb-2 w-48"></div>
                <div className="h-4 bg-gray-2 rounded mb-2 w-32"></div>
                <div className="h-5 bg-gray-2 rounded w-24"></div>
              </div>
              <div className="text-right">
                <div className="h-3 bg-gray-2 rounded w-16 mb-1"></div>
                <div className="h-4 bg-gray-2 rounded w-20"></div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-2 rounded"></div>
              <div className="h-4 bg-gray-2 rounded w-3/4"></div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-4 bg-gray-2 rounded w-16"></div>
              <div className="flex gap-2">
                <div className="w-7 h-7 bg-gray-2 rounded-full"></div>
                <div className="w-7 h-7 bg-gray-2 rounded-full"></div>
                <div className="w-7 h-7 bg-gray-2 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex-shrink-0 flex items-center">
            <div className="h-10 w-32 bg-gray-2 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerCardSkeleton;