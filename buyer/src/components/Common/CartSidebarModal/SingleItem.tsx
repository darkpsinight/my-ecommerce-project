import React from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/redux/store";
import Image from "next/image";
import { formatPrice } from "@/utils/currency";
import { removeItemFromCartAsync, selectCartRemovingItem } from "@/redux/features/cart-slice";

const SingleItem = ({ item, removeItemFromCart }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isRemoving = useAppSelector(selectCartRemovingItem);

  const handleRemoveFromCart = () => {
    dispatch(removeItemFromCartAsync({ listingId: item.listingId || item.id }));
  };



  return (
    <div className="group p-4 rounded-xl bg-gradient-to-r from-white to-blue-light-5/30 border border-gray-3 hover:border-blue-light-4 hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-1 to-blue-light-5 p-1 min-w-[80px] w-20 h-20">
          <div className="w-full h-full rounded-lg overflow-hidden bg-white">
            <Image 
              src={item.imgs?.thumbnails?.[0] || item.imgs?.previews?.[0] || '/images/placeholder-product.png'} 
              alt="product" 
              width={80} 
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Quantity Badge */}
          {item.quantity > 1 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <span className="text-white text-xs font-bold">{item.quantity}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dark mb-2 line-clamp-2 group-hover:text-blue transition-colors duration-200">
            {item.title}
          </h3>
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green rounded-full"></div>
              <span className="text-green text-sm font-medium">Available</span>
              {item.quantity > 1 && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-gray-4 rounded-full"></div>
                  <span className="text-blue text-sm font-medium">Qty: {item.quantity}</span>
                </div>
              )}
            </div>
            <p className="font-bold text-blue text-lg">
              ${formatPrice(item.discountedPrice)}
            </p>
          </div>
        </div>

        <button
          onClick={handleRemoveFromCart}
          disabled={isRemoving}
          aria-label="Remove item from cart"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-light-6 border border-red-light-4 text-red hover:bg-red hover:text-white transition-all duration-200 hover:scale-110 group-hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRemoving ? (
            <div className="w-4 h-4 border-2 border-red border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg
              className="fill-current"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default SingleItem;
