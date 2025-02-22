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

interface CartItem {
  id: number;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
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
      await dispatch(removeItemFromCart(item.id));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity === quantity) return;
    
    setIsUpdating(true);
    setQuantity(newQuantity); // Optimistic update
    
    try {
      await dispatch(updateCartItemQuantity({ id: item.id, quantity: newQuantity }));
    } catch (error) {
      setQuantity(quantity); // Revert on error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 border-t border-gray-3 py-6 px-4 sm:px-6 transition-opacity duration-200 ${isUpdating ? 'opacity-60' : ''}`}>
      {/* Product Image and Title */}
      <div className="flex-grow flex items-center gap-4 min-w-0">
        <Link href={`/product/${item.id}`} className="shrink-0">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gray-2 rounded-lg overflow-hidden">
            <Image 
              src={item.imgs?.thumbnails[0] || '/images/placeholder.jpg'} 
              alt={item.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 80px, 96px"
            />
          </div>
        </Link>
        
        <div className="min-w-0">
          <Link 
            href={`/product/${item.id}`}
            className="text-lg font-medium text-gray-900 hover:text-blue transition-colors duration-200 line-clamp-2"
          >
            {item.title}
          </Link>
          <div className="mt-1 flex items-center gap-4">
            <p className="text-lg font-medium text-gray-900">
              ${item.discountedPrice}
            </p>
            <p className="text-sm text-gray-500">
              Subtotal: ${(item.discountedPrice * quantity).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Quantity Control and Remove Button */}
      <div className="flex items-center gap-4 self-end sm:self-center">
        <QuantityControl
          quantity={quantity}
          onIncrease={() => handleQuantityChange(quantity + 1)}
          onDecrease={() => handleQuantityChange(quantity - 1)}
          disabled={isUpdating}
          handleQuantityChange={handleQuantityChange}
        />
        
        <button
          onClick={handleRemoveFromCart}
          disabled={isUpdating}
          aria-label="Remove item from cart"
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-2 border border-gray-3 text-gray-500 transition-colors duration-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-5 h-5"
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
        </button>
      </div>
    </div>
  );
};

export default SingleItem;
