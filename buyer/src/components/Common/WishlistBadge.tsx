"use client";

import React from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/redux/store';
import { selectWishlistCount, selectIsItemInWishlist, selectWishlistLoading } from '@/redux/features/wishlist-slice';

interface WishlistBadgeProps {
  /**
   * Show as icon only (for mobile/compact view)
   */
  iconOnly?: boolean;
  /**
   * Custom class names
   */
  className?: string;
  /**
   * For single item - shows heart icon with filled/unfilled state
   */
  itemId?: string;
  /**
   * Callback for single item toggle
   */
  onToggle?: () => void;
}

/**
 * Wishlist Badge Component
 * 
 * Can be used in two modes:
 * 1. Navigation badge - shows count and links to wishlist page
 * 2. Single item heart - shows add/remove toggle for specific item
 */
const WishlistBadge: React.FC<WishlistBadgeProps> = ({
  iconOnly = false,
  className = '',
  itemId,
  onToggle
}) => {
  const wishlistCount = useAppSelector(selectWishlistCount);
  const isInWishlist = useAppSelector((state) => 
    itemId ? selectIsItemInWishlist(state, itemId) : false
  );
  const isLoading = useAppSelector(selectWishlistLoading);

  // Single item heart mode
  if (itemId && onToggle) {
    return (
      <button
        onClick={onToggle}
        disabled={isLoading}
        className={`group transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg
            className={`w-5 h-5 transition-colors ${
              isInWishlist 
                ? 'text-red fill-current' 
                : 'text-gray-400 group-hover:text-red'
            }`}
            fill={isInWishlist ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>
    );
  }

  // Navigation badge mode
  return (
    <Link 
      href="/wishlist" 
      className={`relative group transition-all duration-200 hover:scale-105 ${className}`}
      aria-label={`Wishlist (${wishlistCount} items)`}
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <svg
            className="w-6 h-6 text-gray-600 group-hover:text-red transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          
          {/* Badge count */}
          {wishlistCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-medium shadow-md animate-pulse">
              {wishlistCount > 99 ? '99+' : wishlistCount}
            </span>
          )}
        </div>
        
        {/* Text label for desktop */}
        {!iconOnly && (
          <span className="hidden lg:block text-sm font-medium text-gray-600 group-hover:text-red transition-colors">
            Wishlist
            {wishlistCount > 0 && (
              <span className="ml-1 text-xs text-gray-400">
                ({wishlistCount})
              </span>
            )}
          </span>
        )}
      </div>
    </Link>
  );
};

export default WishlistBadge;