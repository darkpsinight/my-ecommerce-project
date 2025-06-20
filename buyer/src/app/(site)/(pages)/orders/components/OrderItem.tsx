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
    <div className="bg-gray-1 rounded-2xl p-6 border border-gray-3 shadow-1 hover:shadow-2 transition-shadow duration-200">
      <div className="flex items-start gap-6">
        {/* Product Image */}
        {item.listing?.thumbnailUrl && (
          <div className="flex-shrink-0">
            <div className="relative group">
              <Image
                src={item.listing.thumbnailUrl}
                alt={item.listing.title}
                width={100}
                height={100}
                className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-1 group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </div>
          </div>
        )}
        
        {/* Product Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-xl font-bold text-dark mb-2">
              {item.listing?.title || item.title}
            </h4>
            <div className="text-right">
              <p className="text-sm text-body mb-1">
                ${item.unitPrice.toFixed(2)} × {item.quantity}
              </p>
              <p className="text-2xl font-bold text-blue">
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
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue text-white shadow-1">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {item.platform}
            </span>
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green text-white shadow-1">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h.5A2.5 2.5 0 0021 5.5V3.935" />
              </svg>
              {item.region}
            </span>
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-teal text-white shadow-1">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Qty: {item.quantity}
            </span>
          </div>
          
          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Seller Information */}
            {order.seller && (
              <div className="bg-white rounded-xl p-4 shadow-1 border border-gray-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-body font-medium">SELLER</p>
                    <p className="text-sm font-semibold text-dark">{order.seller.name}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Payment Method */}
            <div className="bg-white rounded-xl p-4 shadow-1 border border-gray-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-light rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-body font-medium">PAYMENT</p>
                  <p className="text-sm font-semibold text-dark">
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