import React from "react";
import Link from "next/link";
import { useCartModalContext } from "@/app/context/CartSidebarModalContext";

const EmptyCart = () => {
  const { closeCartModal } = useCartModalContext();

  return (
    <div className="text-center py-12">
      <div className="mx-auto pb-8">
        <div className="relative mx-auto w-32 h-32 mb-6">
          {/* Animated background circles */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-light-5 to-purple-light/20 animate-pulse"></div>
          <div className="absolute inset-2 rounded-full bg-white"></div>
          
          {/* Cart Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-blue-light-2"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
            </svg>
          </div>
          
          {/* Floating elements */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow rounded-full opacity-60 animate-bounce"></div>
          <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green rounded-full opacity-40 animate-pulse"></div>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <h3 className="text-2xl font-bold text-dark">Your cart is empty!</h3>
        <p className="text-dark-4 text-lg max-w-md mx-auto">
          Discover amazing digital codes and start building your collection today.
        </p>
      </div>

      <div className="space-y-4">
        <Link
          onClick={() => closeCartModal()}
          href="/products"
          className="w-full max-w-sm mx-auto flex justify-center items-center gap-3 font-semibold text-white bg-gradient-to-r from-blue to-blue-dark hover:from-blue-dark hover:to-blue py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19 7H18V6C18 3.79 16.21 2 14 2H10C7.79 2 6 3.79 6 6V7H5C4.45 7 4 7.45 4 8S4.45 9 5 9H6V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V9H19C19.55 9 20 8.55 20 8S19.55 7 19 7ZM8 6C8 4.9 8.9 4 10 4H14C15.1 4 16 4.9 16 6V7H8V6Z"/>
          </svg>
          Start Shopping
        </Link>
      </div>
    </div>
  );
};

export default EmptyCart;
