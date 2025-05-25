import React from "react";

// Skeleton Loader Components
export const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-2 p-7.5 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
  </div>
);

export const SkeletonTable = () => (
  <div className="bg-white rounded-lg shadow-2 p-7.5 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  </div>
);

export const WalletPageSkeleton = () => (
  <section className="overflow-hidden pt-[250px] sm:pt-[180px] lg:pt-[140px] bg-gray-2 pb-15">
    <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
      {/* Header Skeleton */}
      <div className="mb-10 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-1/3 mb-1.5"></div>
        <div className="h-7 bg-gray-200 rounded w-1/4"></div>
      </div>

      {/* Balance Card Skeleton */}
      <SkeletonCard />

      <div className="my-10">
        <SkeletonCard />
      </div>

      {/* Transactions Table Skeleton */}
      <SkeletonTable />
    </div>
  </section>
);
