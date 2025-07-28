"use client";
import React from 'react';
import { Product } from '@/types/product';

interface BreadcrumbProps {
  product: Product | null;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ product }) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <a
            href="/"
            className="text-body hover:text-blue transition-colors duration-200"
          >
            Home
          </a>
        </li>
        <li aria-hidden="true" className="text-gray-4">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </li>
        <li>
          <a
            href="/products"
            className="text-body hover:text-blue transition-colors duration-200"
          >
            Shop
          </a>
        </li>
        <li aria-hidden="true" className="text-gray-4">
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </li>
        {product?.categoryName && (
          <>
            <li>
              <span className="text-body">{product.categoryName}</span>
            </li>
            <li aria-hidden="true" className="text-gray-4">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </li>
          </>
        )}
        <li
          aria-current="page"
          className="text-dark font-medium truncate max-w-[200px]"
        >
          {product?.title || "Product Details"}
        </li>
      </ol>
    </nav>
  );
};

export default Breadcrumb;