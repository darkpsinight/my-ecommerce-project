"use client";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

interface CopyableOrderIdProps {
  orderId: string;
  className?: string;
  showFullId?: boolean;
  truncateLength?: number;
}

const CopyableOrderId: React.FC<CopyableOrderIdProps> = ({ 
  orderId, 
  className = "", 
  showFullId = false,
  truncateLength = 8
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const displayText = showFullId ? orderId : `${orderId.slice(0, truncateLength)}...`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setIsCopied(true);
      toast.success("Order ID copied to clipboard!");
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy order ID:", error);
      toast.error("Failed to copy order ID");
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={copyToClipboard}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          text-sm font-mono text-gray-600 
          transition-all duration-200 ease-in-out
          ${isHovered ? 'bg-gray-100 text-gray-800' : 'hover:bg-gray-50'}
          ${isHovered ? 'px-2 py-1 rounded-md' : ''}
          ${className}
        `}
        title={`Click to copy: ${orderId}`}
      >
        <div className="flex items-center space-x-1">
          <span>{displayText}</span>
          {isHovered && (
            <svg 
              className="w-3 h-3 text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
              />
            </svg>
          )}
          {isCopied && (
            <svg 
              className="w-3 h-3 text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          )}
        </div>
      </button>
      
      {/* Tooltip showing full ID on hover */}
      {isHovered && !showFullId && (
        <div 
          className="absolute z-50 px-3 py-2 text-xs rounded-md whitespace-nowrap bottom-full left-1/2 transform -translate-x-1/2 mb-2 shadow-lg"
          style={{
            backgroundColor: '#1f2937',
            color: '#ffffff',
            border: '1px solid #d1d5db'
          }}
        >
          {orderId}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #1f2937'
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default CopyableOrderId;