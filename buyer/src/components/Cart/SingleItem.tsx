import React, { useState } from "react";
import { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";
import {
  removeItemFromCart,
  updateCartItemQuantity,
} from "@/redux/features/cart-slice";
import Image from "next/image";
import QuantityControl from "./QuantityControl";
import Link from "next/link";
import { formatPrice, multiplyCurrency } from "@/utils/currency";
import toast from "react-hot-toast";

interface CartItem {
  id: string;
  listingId: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
  sellerId: string;
  availableStock?: number;
  listingSnapshot?: {
    category?: string;
    subcategory?: string;
    platform?: string;
    region?: string;
  };
}

interface SingleItemProps {
  item: CartItem;
}

const SingleItem: React.FC<SingleItemProps> = ({ item }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);

  const dispatch = useDispatch<AppDispatch>();



  const handleRemoveFromCart = async () => {
    setIsUpdating(true);
    try {
      await dispatch(removeItemFromCart({ listingId: item.listingId || item.id }));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity === quantity) return;
    
    // Check if quantity exceeds available stock
    const maxStock = item.availableStock ?? 999;
    if (maxStock < 999 && newQuantity > maxStock) {
      // Show toast message for better UX
      toast.error(`Only ${maxStock} codes available in stock`);
      // Force update to max available stock if current quantity is greater than stock
      if (quantity > maxStock) {
        setQuantity(maxStock);
        try {
          await dispatch(updateCartItemQuantity({ listingId: item.listingId || item.id, quantity: maxStock }));
        } catch (error) {
          console.error('Error updating quantity to max stock:', error);
        }
      }
      return; // Don't proceed if exceeding stock
    }
    
    setIsUpdating(true);
    setQuantity(newQuantity); // Optimistic update
    
    try {
      await dispatch(updateCartItemQuantity({ listingId: item.listingId || item.id, quantity: newQuantity }));
    } catch (error) {
      setQuantity(quantity); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`group relative flex flex-col lg:flex-row items-start lg:items-center gap-6 py-8 px-6 transition-all duration-300 hover:bg-blue-light-5/30 cart-item-hover ${isUpdating ? 'opacity-60' : ''}`}>
      {/* Product Image and Title */}
      <div className="flex-grow flex flex-col sm:flex-row items-start sm:items-center gap-6 min-w-0">
        <Link href={`/product/${item.id}`} className="shrink-0">
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-1 to-gray-2 rounded-2xl overflow-hidden shadow-1">
            <Image 
              src={item.imgs?.thumbnails?.[0] || item.imgs?.previews?.[0] || '/images/placeholder.jpg'} 
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 96px, 128px"
            />
            
            {/* Digital Code Badge */}
            <div className="absolute top-2 left-2">
              <div className="bg-blue text-white text-xs px-2 py-1 rounded-lg font-bold shadow-1">
                DIGITAL
              </div>
            </div>
          </div>
        </Link>
        
        <div className="min-w-0 flex-1">
          <Link 
            href={`/product/${item.id}`}
            className="block text-xl font-bold text-gray-7 hover:text-blue transition-colors duration-200 line-clamp-2 mb-3"
          >
            {item.title}
          </Link>
          
          {/* Product Details */}
          <div className="space-y-3">
            {/* Category and Platform Info */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.listingSnapshot?.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-light-5 text-green-dark border border-green-light-3">
                  {item.listingSnapshot.category}
                </span>
              )}
              {item.listingSnapshot?.platform && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-light-5 text-blue-dark border border-blue-light-3">
                  {item.listingSnapshot.platform}
                </span>
              )}
              {item.listingSnapshot?.region && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-light-2 text-yellow-dark border border-yellow-light-1">
                  {item.listingSnapshot.region}
                </span>
              )}
            </div>

            {/* Price Information */}
            <div className="flex items-baseline gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-dark to-green-dark bg-clip-text text-transparent">
                  ${formatPrice(item.discountedPrice)}
                </span>
                <span className="text-sm text-gray-5">per code</span>
              </div>
              <div className="bg-white rounded-xl px-3 py-2 shadow-1">
                <span className="text-sm font-medium text-gray-6">
                  Subtotal: <span className="font-bold text-gray-7">${formatPrice(multiplyCurrency(item.discountedPrice, quantity))}</span>
                </span>
              </div>
            </div>
            
            {/* Stock Information */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-6">
                  {item.availableStock ?? 0} codes available
                </span>
              </div>
              
              {/* Stock Status Badges */}
              {(item.availableStock ?? 0) <= 5 && (item.availableStock ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-yellow-light-2 text-yellow-dark-2 border border-yellow-light-1 animate-pulse">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Low Stock
                </span>
              )}
              {(item.availableStock ?? 0) === 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-light-5 text-red-dark border border-red-light-3">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Out of Stock
                </span>
              )}
              {item.availableStock !== undefined && quantity >= item.availableStock && item.availableStock > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-light-5 text-red-dark border border-red-light-3 animate-pulse">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                  Max in Cart
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quantity Control and Remove Button */}
      <div className="flex flex-col sm:flex-row items-center gap-4 lg:self-center w-full sm:w-auto">
        {/* Quantity Control with Modern Design */}
        <div className="bg-white rounded-2xl p-4 shadow-1 border border-gray-3">
          <div className="text-center mb-3">
            <span className="text-sm font-medium text-gray-6">Quantity</span>
          </div>
          <QuantityControl
            quantity={quantity}
            onIncrease={() => {
              // Only allow increase if not at max stock
              const maxStock = item.availableStock ?? 999;
              if (maxStock < 999 && quantity >= maxStock) {
                toast.error(`Only ${maxStock} codes available in stock`);
                return;
              }
              handleQuantityChange(quantity + 1);
            }}
            onDecrease={() => handleQuantityChange(quantity - 1)}
            min={1}
            max={item.availableStock ?? 999}
            disabled={isUpdating}
            handleQuantityChange={handleQuantityChange}
          />
        </div>
        
        {/* Remove Button with Modern Design */}
        <button
          onClick={handleRemoveFromCart}
          disabled={isUpdating}
          aria-label="Remove item from cart"
          className="group/remove flex flex-col items-center justify-center gap-2 w-full sm:w-20 h-20 rounded-2xl bg-white border-2 border-gray-3 text-gray-5 transition-all duration-300 hover:border-red hover:bg-red-light-6 hover:text-red disabled:opacity-50 disabled:cursor-not-allowed shadow-1 hover:shadow-2"
        >
          <svg
            className="w-6 h-6 transition-transform duration-300 group-hover/remove:scale-110"
            viewBox="0 0 20 20"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs font-medium">Remove</span>
        </button>
      </div>
    </div>
  );
};

export default SingleItem;
