import React from "react";
import { useDispatch } from "react-redux";
import { AppDispatch, useAppSelector } from "@/redux/store";
import Image from "next/image";
import { formatPrice } from "@/utils/currency";
import { updateCartItemAsync, removeItemFromCartAsync, selectCartUpdatingItem, selectCartRemovingItem } from "@/redux/features/cart-slice";

const SingleItem = ({ item, removeItemFromCart }) => {
  const dispatch = useDispatch<AppDispatch>();
  const isUpdating = useAppSelector(selectCartUpdatingItem);
  const isRemoving = useAppSelector(selectCartRemovingItem);

  const handleRemoveFromCart = () => {
    dispatch(removeItemFromCartAsync({ listingId: item.listingId || item.id }));
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart();
    } else {
      dispatch(updateCartItemAsync({ 
        listingId: item.listingId || item.id, 
        quantity: newQuantity 
      }));
    }
  };

  const handleIncrement = () => {
    handleQuantityChange(item.quantity + 1);
  };

  const handleDecrement = () => {
    // Only decrease if quantity is greater than 1
    if (item.quantity > 1) {
      handleQuantityChange(item.quantity - 1);
    }
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
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="w-2 h-2 bg-white rounded-full m-1"></div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-dark mb-2 line-clamp-2 group-hover:text-blue transition-colors duration-200">
            {item.title}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green rounded-full"></div>
              <span className="text-green text-sm font-medium">Available</span>
            </div>
            <div className="w-1 h-1 bg-gray-4 rounded-full"></div>
            <p className="font-bold text-blue text-lg">
              ${formatPrice(item.discountedPrice)}
            </p>
          </div>
          
          {/* Quantity Controls */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-dark-4 font-medium">Qty:</span>
            <div className="flex items-center gap-2 bg-gray-1 rounded-lg p-1">
              <button
                onClick={handleDecrement}
                disabled={isUpdating || isRemoving || item.quantity <= 1}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white hover:bg-blue hover:text-white transition-colors duration-200 text-dark-4 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                {isUpdating ? (
                  <div className="w-3 h-3 border-2 border-blue border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                )}
              </button>
              <span className="w-8 text-center font-semibold text-dark">
                {item.quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={isUpdating || isRemoving}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white hover:bg-blue hover:text-white transition-colors duration-200 text-dark-4 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                {isUpdating ? (
                  <div className="w-3 h-3 border-2 border-blue border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleRemoveFromCart}
          aria-label="Remove item from cart"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-red-light-6 border border-red-light-4 text-red hover:bg-red hover:text-white transition-all duration-200 hover:scale-110 group-hover:shadow-lg"
        >
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
        </button>
      </div>
    </div>
  );
};

export default SingleItem;
