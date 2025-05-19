"use client";
import React from "react";

interface ProductCardSkeletonProps {
  gridView?: boolean;
}

const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ gridView = true }) => {
  if (gridView) {
    return (
      <div className="animate-pulse group relative">
        {/* Card container with shadow and rounded corners */}
        <div className="relative overflow-hidden rounded-lg bg-white shadow-1 mb-3 w-full h-[220px]">
          {/* Image placeholder */}
          <div className="w-full h-full bg-gray-3"></div>
          
          {/* Action buttons placeholder at bottom */}
          <div className="absolute left-0 bottom-0 w-full flex items-center justify-center gap-1.5 pb-3">
            <div className="w-7 h-7 rounded-[4px] bg-gray-3"></div>
            <div className="w-24 h-7 rounded-[4px] bg-gray-3"></div>
            <div className="w-7 h-7 rounded-[4px] bg-gray-3"></div>
          </div>
        </div>
        
        {/* Rating stars placeholder */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="w-3 h-3 bg-gray-3 rounded-full"></div>
            ))}
          </div>
          <div className="w-8 h-3 bg-gray-3 rounded"></div>
        </div>
        
        {/* Product title placeholder */}
        <div className="h-10">
          <div className="h-4 bg-gray-3 rounded w-full mb-1"></div>
          <div className="h-4 bg-gray-3 rounded w-3/4"></div>
        </div>
        
        {/* Price placeholder */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="h-5 bg-gray-3 rounded w-16"></div>
          <div className="h-4 bg-gray-3 rounded w-12"></div>
        </div>
      </div>
    );
  } else {
    // List view skeleton
    return (
      <div className="animate-pulse flex flex-wrap md:flex-nowrap gap-7.5 items-center bg-white p-5 rounded-lg shadow-1">
        {/* Image placeholder */}
        <div className="w-full md:w-[270px] h-[220px] bg-gray-3 rounded-lg"></div>
        
        <div className="w-full md:flex-1">
          {/* Rating stars placeholder */}
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="w-3 h-3 bg-gray-3 rounded-full"></div>
              ))}
            </div>
            <div className="w-8 h-3 bg-gray-3 rounded"></div>
          </div>
          
          {/* Product title placeholder */}
          <div className="mb-3">
            <div className="h-5 bg-gray-3 rounded w-3/4 mb-1"></div>
            <div className="h-5 bg-gray-3 rounded w-1/2"></div>
          </div>
          
          {/* Description placeholder */}
          <div className="mb-4">
            <div className="h-3 bg-gray-3 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-3 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-3 rounded w-2/3"></div>
          </div>
          
          {/* Price placeholder */}
          <div className="flex items-center gap-1.5 mb-4">
            <div className="h-6 bg-gray-3 rounded w-20"></div>
            <div className="h-5 bg-gray-3 rounded w-16"></div>
          </div>
          
          {/* Action buttons placeholder */}
          <div className="flex items-center gap-2">
            <div className="w-32 h-10 rounded-md bg-gray-3"></div>
            <div className="w-10 h-10 rounded-md bg-gray-3"></div>
            <div className="w-10 h-10 rounded-md bg-gray-3"></div>
          </div>
        </div>
      </div>
    );
  }
};

export default ProductCardSkeleton;
