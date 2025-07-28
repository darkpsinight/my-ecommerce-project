"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { Product } from '@/types/product';

interface ProductHeaderProps {
  product: Product;
}

const ProductHeader: React.FC<ProductHeaderProps> = ({ product }) => {
  const router = useRouter();

  return (
    <div className="mb-6">
      <h1 className="font-bold text-2xl lg:text-3xl xl:text-4xl text-gray-900 mb-3 leading-tight">
        {product.title}
      </h1>

      {/* Category & Seller Info */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {product.categoryName && (
          <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 rounded-full">
            <span className="text-blue-600 text-sm font-medium">
              {product.categoryName}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-sm">Sold by</span>
          <button
            onClick={() => router.push(`/marketplace/${product.sellerId}`)}
            className="text-blue font-semibold hover:text-blue-dark transition-colors duration-200 cursor-pointer underline decoration-1 underline-offset-2 hover:decoration-2"
          >
            {product.sellerMarketName || product.sellerName || "Unknown Seller"}
          </button>
          {product.isSellerVerified && (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-green-600"
              >
                <path
                  d="M12 2L4 5.4V11.8C4 16.4 7.4 20.5 12 21.5C16.6 20.5 20 16.4 20 11.8V5.4L12 2ZM10.5 16.5L6.5 12.5L7.9 11.1L10.5 13.7L16.1 8.1L17.5 9.5L10.5 16.5Z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-xs text-green-600 font-medium">
                Verified
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductHeader;