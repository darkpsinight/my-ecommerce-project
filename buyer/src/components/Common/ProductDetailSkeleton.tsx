"use client";
import React from "react";
import PageContainer from "./PageContainer";

const ProductDetailSkeleton: React.FC = () => {
  return (
    <PageContainer>
      <section className="overflow-hidden py-20 bg-gray-2">
        <div className="animate-pulse flex flex-col lg:flex-row gap-7.5 xl:gap-17.5">
          {/* Left side - Product image area */}
          <div className="lg:max-w-[570px] w-full">
            {/* Main image container */}
            <div className="lg:min-h-[512px] rounded-lg shadow-1 bg-white p-4 sm:p-7.5 relative flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                {/* Zoom button placeholder */}
                <div className="w-11 h-11 rounded-[5px] bg-gray-3 absolute top-4 lg:top-6 right-4 lg:right-6 z-50"></div>

                {/* Main image placeholder */}
                <div className="w-[450px] h-[450px] bg-gray-3 rounded-md"></div>
              </div>
            </div>

            {/* Thumbnails container */}
            <div className="flex flex-wrap sm:flex-nowrap gap-4.5 mt-6 justify-center">
              {/* Generate 4 thumbnail placeholders */}
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center w-20 h-20 overflow-hidden rounded-lg bg-white shadow-1 border-2 border-transparent"
                >
                  <div className="w-16 h-16 bg-gray-3 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Product details */}
          <div className="max-w-[539px] w-full">
            {/* Title and discount badge */}
            <div className="flex flex-col mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 bg-gray-3 rounded w-3/4"></div>
                <div className="h-6 w-16 bg-blue rounded"></div>
              </div>

              {/* Category */}
              <div className="h-4 bg-gray-3 rounded w-1/3 mb-2"></div>
            </div>

            {/* Ratings and stock status */}
            <div className="flex flex-wrap items-center gap-5.5 mb-4.5">
              <div className="flex items-center gap-2.5">
                {/* Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="w-4 h-4 bg-gray-3 rounded-full"></div>
                  ))}
                </div>
                <div className="h-4 bg-gray-3 rounded w-32"></div>
              </div>

              {/* In stock indicator */}
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 bg-gray-3 rounded-full"></div>
                <div className="h-4 bg-gray-3 rounded w-16"></div>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-4.5">
              <div className="h-8 bg-gray-3 rounded w-24"></div>
              <div className="h-6 bg-gray-3 rounded w-20"></div>
            </div>

            {/* Product details list */}
            <div className="mb-6">
              {/* Instant Auto Delivery */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-gray-3 rounded-full"></div>
                <div className="h-5 bg-gray-3 rounded w-40"></div>
              </div>

              {/* Platform */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-gray-3 rounded-full"></div>
                <div className="h-5 bg-gray-3 rounded w-32"></div>
              </div>

              {/* Region */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-gray-3 rounded-full"></div>
                <div className="h-5 bg-gray-3 rounded w-28"></div>
              </div>

              {/* Languages */}
              <div className="flex items-start gap-2 mb-6">
                <div className="w-5 h-5 bg-gray-3 rounded-full mt-1"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-3 rounded w-full mb-2"></div>
                  <div className="h-5 bg-gray-3 rounded w-3/4"></div>
                </div>
              </div>

              {/* Product tabs placeholder */}
              <div className="flex border-b border-gray-3 mb-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className={`h-10 px-4 flex items-center justify-center ${index === 0 ? 'border-b-2 border-blue' : ''}`}
                  >
                    <div className="h-4 bg-gray-3 rounded w-20"></div>
                  </div>
                ))}
              </div>

              {/* Tab content placeholder */}
              <div className="mb-4">
                <div className="h-4 bg-gray-3 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-3 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-3 rounded w-3/4"></div>
              </div>
            </div>

            {/* Quantity and buttons */}
            <div className="flex items-center gap-3 mb-6">
              {/* Quantity selector */}
              <div className="flex items-center">
                <div className="w-10 h-12 bg-gray-3 rounded-l-md"></div>
                <div className="w-12 h-12 bg-white border border-gray-3"></div>
                <div className="w-10 h-12 bg-gray-3 rounded-r-md"></div>
              </div>

              {/* Add to cart button */}
              <div className="h-12 bg-blue rounded-md w-40"></div>

              {/* Wishlist button */}
              <div className="w-12 h-12 bg-gray-3 rounded-md"></div>
            </div>

            {/* Tags section */}
            <div className="mt-8">
              <div className="h-5 bg-gray-3 rounded w-16 mb-3"></div>
              <div className="flex flex-wrap gap-2">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="h-8 bg-gray-3 rounded-md w-16"></div>
                ))}
              </div>
            </div>

            {/* Category tabs */}
            <div className="mt-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {['Steam', 'Wallet Code', 'Digital Code', 'Gaming', 'Gift Card'].map((_, index) => (
                  <div key={index} className="h-8 bg-gray-3 rounded-md px-4"></div>
                ))}
              </div>

              {/* Letter tags */}
              <div className="flex flex-wrap gap-2">
                {['a', 'aa', 'aaa', 'aaaa', 'aaz', 'z', 'ze', 'e', 'ee', 'r'].map((_, index) => (
                  <div key={index} className="h-8 bg-gray-3 rounded-md w-8"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageContainer>
  );
};

export default ProductDetailSkeleton;
