"use client";
import React from "react";
import { useAppSelector } from "@/redux/store";
import { useDispatch } from "react-redux";
import { removeAllItemsFromCart } from "@/redux/features/cart-slice";
import SingleItem from "./SingleItem";
import Link from "next/link";
import PageContainer from "../Common/PageContainer";

const Cart = () => {
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const dispatch = useDispatch();

  const totalAmount = cartItems.reduce(
    (total, item) => total + item.discountedPrice * item.quantity,
    0
  );

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      dispatch(removeAllItemsFromCart());
    }
  };

  if (cartItems.length === 0) {
    return (
      <PageContainer>
        <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-8">
              <svg
                className="w-24 h-24 mx-auto text-gray-300"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="50"
                  fill="currentColor"
                  opacity="0.1"
                />
                <path
                  d="M65 35H35C33.8954 35 33 35.8954 33 37V63C33 64.1046 33.8954 65 35 65H65C66.1046 65 67 64.1046 67 63V37C67 35.8954 66.1046 35 65 35Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M42 42L58 58M58 42L42 58"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Looks like you have not added any items to your cart yet.
            </p>
            <div className="mt-4">
              <Link
                href="/shop-with-sidebar"
                className="w-full lg:w-10/12 mx-auto flex justify-center font-medium text-white bg-dark py-[13px] px-6 rounded-md ease-out duration-200 hover:bg-opacity-95"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="py-12 sm:py-20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            Shopping Cart
          </h1>
          <button
            onClick={handleClearCart}
            className="text-sm text-gray-600 hover:text-red-600 transition-colors duration-200"
          >
            Clear Cart
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#3C50E0] overflow-hidden">
          <div className="divide-y divide-gray-200">
            {cartItems.map((item) => (
              <SingleItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm border border-[#3C50E0] p-6">
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div className="flex-1">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-medium text-gray-900">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:w-72">
              <Link
                href="/checkout"
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-[#3C50E0] text-base font-medium rounded-md text-gray-700 bg-white hover:bg-[#3C50E0] hover:text-white transition-all duration-200 transform hover:scale-105"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/shop-with-sidebar"
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-[#3C50E0] text-base font-medium rounded-md text-gray-700 bg-white hover:bg-[#3C50E0] hover:text-white transition-all duration-200 transform hover:scale-105"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Cart;
