"use client";
import React from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';

interface ProductImageProps {
  product: Product;
}

const ProductImage: React.FC<ProductImageProps> = ({ product }) => {
  const calculateDiscountPercentage = () => {
    if (
      product.price &&
      product.discountedPrice &&
      product.price > product.discountedPrice
    ) {
      const discount =
        ((product.price - product.discountedPrice) / product.price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  return (
    <div className="xl:max-w-[600px] w-full">
      <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden group">
        {/* Discount Badge */}
        {product.price && product.price > product.discountedPrice && (
          <div className="absolute top-4 left-4 z-10">
            <div className="inline-flex font-semibold text-sm text-white bg-gradient-to-r from-red to-red-dark rounded-full py-2 px-4 shadow-lg animate-pulse">
              {calculateDiscountPercentage()}% OFF
            </div>
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-4 right-4 z-10">
          <div className="inline-flex items-center gap-1 font-medium text-sm text-green-700 bg-green-light-6 rounded-full py-2 px-3 shadow-lg">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            In Stock
          </div>
        </div>

        {/* Product Image */}
        <div className="aspect-square lg:min-h-[500px] p-8 flex items-center justify-center bg-gradient-to-br from-blue-light-5 via-white to-purple-50">
          <Image
            src={
              product.imgs?.previews?.[0] ||
              product.thumbnailUrl ||
              "/images/products/placeholder.png"
            }
            alt={product.title || "Product details"}
            width={500}
            height={500}
            className="object-contain max-h-full w-full transition-all duration-500 group-hover:scale-105 drop-shadow-2xl"
            priority
          />
        </div>

        {/* Floating Trust Badges */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg py-2 px-3 shadow-lg">
            <svg
              className="w-4 h-4 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium text-gray-700">
              Verified
            </span>
          </div>

          {product.autoDelivery && (
            <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg py-2 px-3 shadow-lg">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-xs font-medium text-gray-700">
                Instant
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductImage;