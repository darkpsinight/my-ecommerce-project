"use client";
import React from "react";
import Image from "next/image";
import { Order } from "@/services/orders";
import { getPaymentMethodDisplayName } from "../utils/orderUtils";

interface OrderItemProps {
  item: any; // Order item from the API
  order: Order;
}

const OrderItem: React.FC<OrderItemProps> = ({ item, order }) => {
  return (
    <div className="bg-gray-1 rounded-2xl p-4 sm:p-6 border border-gray-3 shadow-1 hover:shadow-2 transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
        {/* Product Image */}
        {item.listing?.thumbnailUrl && (
          <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
            <div className="relative group">
              <Image
                src={item.listing.thumbnailUrl}
                alt={item.listing.title}
                width={100}
                height={100}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-white shadow-1 group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </div>
          </div>
        )}
        
        {/* Product Details */}
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-4">
            <h4 className="text-lg sm:text-xl font-bold text-dark">
              {item.listing?.title || item.title}
            </h4>
            <div className="text-left sm:text-right">
              <p className="text-sm text-body mb-1">
                ${item.unitPrice.toFixed(2)} × {item.quantity}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-blue">
                ${item.totalPrice.toFixed(2)}
              </p>
            </div>
          </div>
          
          {item.listing?.description && (
            <div className="bg-white rounded-lg p-4 mb-4 shadow-1 border border-gray-3">
              <p 
                className="text-sm text-body line-clamp-2" 
                dangerouslySetInnerHTML={{ __html: item.listing.description }}
              />
            </div>
          )}
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-4">
            <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-blue text-white shadow-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate max-w-[100px] sm:max-w-none">{item.platform}</span>
            </span>
            <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-green text-white shadow-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0021 5.5V3.935" />
              </svg>
              <span className="truncate max-w-[80px] sm:max-w-none">{item.region}</span>
            </span>
            <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-teal text-white shadow-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Quantity: {item.quantity}
            </span>
          </div>
          
          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Seller Information */}
            {order.seller && (
              <div className="bg-white rounded-xl p-3 sm:p-4 shadow-1 border border-gray-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-body font-medium">SELLER</p>
                    <p className="text-sm font-semibold text-dark truncate">{order.seller.name}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Payment Method */}
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-1 border border-gray-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-light rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-body font-medium">PAYMENT</p>
                  <p className="text-sm font-semibold text-dark truncate">
                    {getPaymentMethodDisplayName(order.paymentMethod)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;