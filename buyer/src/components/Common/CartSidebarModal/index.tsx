"use client";
import React, { useEffect, useState } from "react";

import { useCartModalContext } from "@/app/context/CartSidebarModalContext";
import {
  removeItemFromCartAsync,
  selectTotalPrice,
} from "@/redux/features/cart-slice";
import { useAppSelector } from "@/redux/store";
import { useSelector } from "react-redux";
import SingleItem from "./SingleItem";
import Link from "next/link";
import EmptyCart from "./EmptyCart";
import { formatPrice } from "@/utils/currency";

const CartSidebarModal = () => {
  const { isCartModalOpen, closeCartModal } = useCartModalContext();
  const cartItems = useAppSelector((state) => state.cartReducer.items);

  const totalPrice = useSelector(selectTotalPrice);

  useEffect(() => {
    // closing modal while clicking outside
    function handleClickOutside(event) {
      if (!event.target.closest(".modal-content")) {
        closeCartModal();
      }
    }

    if (isCartModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCartModalOpen, closeCartModal]);

  return (
    <div
      className={`fixed top-0 right-0 z-99999 w-full h-screen transition-transform duration-150 ${
        isCartModalOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-end h-full">
        <div className="w-full max-w-[500px] h-full shadow-3 bg-white relative modal-content flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-light-5 to-purple-light/10 backdrop-blur-sm border-b border-blue-light-4 px-4 sm:px-7.5 lg:px-11 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue rounded-full flex items-center justify-center">
                  <svg
                    className="fill-white"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
                    <path d="M9 8V17H11V8H9ZM13 8V17H15V8H13Z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-dark text-xl">
                    Shopping Cart
                  </h2>
                  <p className="text-dark-4 text-sm">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => closeCartModal()}
                aria-label="Close cart"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white/80 text-dark-4 hover:text-dark transition-all duration-200 backdrop-blur-sm"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15 5L5 15M5 5L15 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-7.5 lg:px-11 py-6">
            <div className="flex flex-col gap-6">
              {cartItems.length > 0 ? (
                cartItems.map((item, key) => (
                  <SingleItem
                    key={key}
                    item={item}
                    removeItemFromCart={removeItemFromCartAsync}
                  />
                ))
              ) : (
                <EmptyCart />
              )}
            </div>
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-3 bg-gradient-to-r from-gray-1 to-blue-light-5/20 px-4 sm:px-7.5 lg:px-11 py-6">
              <div className="flex items-center justify-between gap-5 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green rounded-full"></div>
                  <p className="font-semibold text-xl text-dark">Subtotal:</p>
                </div>
                <p className="font-bold text-2xl text-blue bg-gradient-to-r from-blue to-purple bg-clip-text text-transparent">
                  ${formatPrice(totalPrice)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  onClick={() => closeCartModal()}
                  href="/cart"
                  className="flex-1 flex justify-center items-center gap-2 font-medium text-blue bg-blue-light-5 border-2 border-blue-light-4 hover:border-blue py-3 px-4 rounded-xl transition-all duration-200 hover:bg-blue-light-4"
                >
                  <svg
                    className="fill-current"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L13.5 2.5L16.17 5.17L10.59 10.76C10.21 11.15 10 11.65 10 12.17V23H12V12.41L15.17 9.24L17.23 11.3C17.5 11.58 17.86 11.73 18.24 11.73C18.62 11.73 18.98 11.58 19.25 11.3L21 9.56V9Z"/>
                  </svg>
                  View Cart
                </Link>

                <Link
                  onClick={() => closeCartModal()}
                  href="/checkout"
                  className="flex-1 flex justify-center items-center gap-2 font-medium text-white bg-gradient-to-r from-blue to-blue-dark hover:from-blue-dark hover:to-blue py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg
                    className="fill-current"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9 20C9 21.1 8.1 22 7 22S5 21.1 5 20 5.9 18 7 18 9 18.9 9 20ZM20 20C20 21.1 19.1 22 18 22S16 21.1 16 20 16.9 18 18 18 20 18.9 20 20ZM1 2V4H3L6.6 11.59L5.24 14.04C5.09 14.32 5 14.65 5 15 5 16.1 5.9 17 7 17H19V15H7.42C7.28 15 7.17 14.89 7.17 14.75L7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.58 17.3 11.97L20.88 5H5.21L4.27 3H1Z"/>
                  </svg>
                  Checkout
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartSidebarModal;
