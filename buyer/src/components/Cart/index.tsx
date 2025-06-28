"use client";
import React from "react";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { clearCartAsync, selectCartItems, selectCartTotalAmount, selectCartClearingCart, fetchCart } from "@/redux/features/cart-slice";
import SingleItem from "./SingleItem";
import Link from "next/link";
import PageContainer from "../Common/PageContainer";
import { EmptyCartIcon, CartIcon } from "../Common/Icons";

const Cart = () => {
  const cartItems = useAppSelector(selectCartItems);
  const totalAmount = useAppSelector(selectCartTotalAmount);
  const isClearing = useAppSelector(selectCartClearingCart);
  const dispatch = useAppDispatch();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your cart?")) {
      dispatch(clearCartAsync({}));
    }
  };

  const handleRefreshCart = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchCart());
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000); // Keep animation for a bit longer for better UX
    }
  };

  if (cartItems.length === 0) {
    return (
      <PageContainer>
        {/* Empty Cart State with Modern Design */}
        <div className="min-h-[70vh] bg-gradient-to-br from-blue-light-5 via-white to-green-light-6 rounded-3xl flex flex-col items-center justify-center py-16 px-4 mt-8 sm:mt-12 relative overflow-hidden cart-slide-up">
          {/* Background Decorations */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-blue-light-3 rounded-full opacity-20 cart-float"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-green-light-3 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-yellow-light-1 rounded-full opacity-30 cart-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-red-light-3 rounded-full opacity-25 animate-ping"></div>
          
          <div className="text-center max-w-lg mx-auto relative z-10">
            {/* Modern Cart Icon */}
            <div className="mb-8 relative cart-scale-in">
              <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue to-blue-light rounded-3xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500 hover:scale-110 cart-shimmer">
                <EmptyCartIcon className="text-white" size={64} />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red rounded-full flex items-center justify-center animate-bounce shadow-lg">
                <span className="text-white text-sm font-bold">0</span>
              </div>
              {/* Floating particles */}
              <div className="absolute -top-4 -left-4 w-4 h-4 bg-yellow rounded-full opacity-50 animate-ping" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute -bottom-4 -right-4 w-3 h-3 bg-green rounded-full opacity-60 animate-pulse" style={{animationDelay: '1.5s'}}></div>
            </div>

            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-dark to-green-dark bg-clip-text text-transparent mb-4">
              Your Cart Awaits!
            </h2>
            <p className="text-lg text-gray-6 mb-8 leading-relaxed">
              Discover amazing digital codes and vouchers from our global marketplace. 
              <span className="font-semibold text-green-dark"> Zero fees</span> and instant delivery!
            </p>
            
            {/* Features */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-1">
                <div className="w-3 h-3 bg-green rounded-full"></div>
                <span className="text-sm font-medium text-gray-7">Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-1">
                <div className="w-3 h-3 bg-blue rounded-full"></div>
                <span className="text-sm font-medium text-gray-7">Zero Fees</span>
              </div>
              <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-1">
                <div className="w-3 h-3 bg-yellow rounded-full"></div>
                <span className="text-sm font-medium text-gray-7">Global Marketplace</span>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                href="/products"
                className="group w-full max-w-sm mx-auto flex items-center justify-center gap-3 font-bold text-white bg-gradient-to-r from-blue to-blue-light py-4 px-8 rounded-2xl shadow-2 hover:shadow-3 transform hover:scale-105 transition-all duration-300"
              >
                <svg className="w-5 h-5 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start Shopping Now
              </Link>

            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="pt-16 pb-8 sm:pt-20 sm:pb-12">
        {/* Header Section with Modern Design */}
        <div className="bg-gradient-to-r from-blue-light-5 to-green-light-6 rounded-3xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue to-blue-light rounded-2xl flex items-center justify-center shadow-2 animate-pulse">
                  <CartIcon className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-dark to-green-dark bg-clip-text text-transparent">
                    Shopping Cart
                  </h1>
                  <p className="text-gray-6 mt-1">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
                  </p>
                </div>
              </div>
              

            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleRefreshCart}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white text-blue border-2 border-blue rounded-xl hover:bg-blue hover:text-white transition-all duration-300 shadow-1 hover:shadow-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={handleClearCart}
                disabled={isClearing}
                className="flex items-center gap-2 px-4 py-2 bg-white text-red border-2 border-red-light-3 rounded-xl hover:bg-red hover:text-white transition-all duration-300 shadow-1 hover:shadow-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isClearing ? 'Clearing...' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="bg-white rounded-3xl shadow-2 border border-gray-3 overflow-hidden mb-8 cart-slide-up" style={{animationDelay: '0.2s'}}>
          <div className="bg-gradient-to-r from-gray-1 to-blue-light-5 px-6 py-4 border-b border-gray-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-light-5 to-green-light-5 opacity-30 cart-shimmer"></div>
            <h3 className="text-lg font-semibold text-gray-7 relative z-10 flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-br from-blue to-green rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              Your Digital Products
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 bg-green rounded-full animate-pulse"></div>
                <span className="text-sm text-green font-medium">Live</span>
              </div>
            </h3>
          </div>
          <div className="divide-y divide-gray-3 cart-scroll max-h-96 overflow-y-auto">
            {cartItems.map((item, index) => (
              <div key={item.id} className={`cart-item-hover ${index % 2 === 0 ? 'bg-white' : 'bg-gray-1'}`} style={{animationDelay: `${0.1 * index}s`}}>
                <SingleItem item={item} />
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="bg-gradient-to-br from-white via-blue-light-5 to-green-light-6 rounded-3xl shadow-2 border border-gray-3 overflow-hidden cart-slide-up" style={{animationDelay: '0.4s'}}>
          <div className="bg-gradient-to-r from-blue-light-4 to-green-light-4 px-6 py-4 border-b border-blue-light-3 relative overflow-hidden">
            <div className="absolute inset-0 cart-rainbow-pulse opacity-20"></div>
            <h3 className="text-xl font-bold text-blue-dark flex items-center gap-3 relative z-10">
              <div className="w-8 h-8 bg-gradient-to-br from-blue to-green rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              Order Summary
              <div className="ml-auto">
                <div className="w-3 h-3 bg-green rounded-full animate-ping"></div>
              </div>
            </h3>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col xl:flex-row gap-8">
              {/* Summary Details */}
              <div className="flex-1 space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-1">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-6 font-medium">Subtotal ({cartItems.length} items)</span>
                      <span className="text-xl font-bold text-gray-7">${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-6 font-medium">Platform Fee</span>
                        <div className="bg-green-light-5 text-green-dark text-xs px-2 py-1 rounded-full font-bold">
                          FREE
                        </div>
                      </div>
                      <span className="text-lg font-semibold text-green">$0.00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-6 font-medium">Instant Delivery</span>
                      <div className="bg-blue-light-5 text-blue-dark text-xs px-2 py-1 rounded-full font-bold">
                        INCLUDED
                      </div>
                    </div>
                    <div className="border-t-2 border-gray-3 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-7">Total</span>
                        <span className="text-3xl font-bold bg-gradient-to-r from-blue-dark to-green-dark bg-clip-text text-transparent">
                          ${totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center shadow-1">
                    <div className="w-10 h-10 bg-green-light-5 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-6">Secure Payment</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-1">
                    <div className="w-10 h-10 bg-blue-light-5 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-6">Instant Delivery</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-1">
                    <div className="w-10 h-10 bg-yellow-light-2 rounded-full flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-yellow-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-6">24/7 Support</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="xl:w-80">
                <div className="bg-white rounded-2xl p-6 shadow-1 space-y-4 cart-glass">
                  <Link
                    href="/checkout"
                    className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue via-blue-light to-green text-white font-bold py-4 px-6 rounded-2xl shadow-2 hover:shadow-3 transform hover:scale-105 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="relative z-10">Checkout</span>
                  </Link>
                  
                  <Link
                    href="/products"
                    className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-gray-1 to-gray-2 text-gray-7 font-semibold py-4 px-6 rounded-2xl border-2 border-gray-3 hover:border-blue hover:text-blue hover:bg-gradient-to-r hover:from-blue-light-5 hover:to-blue-light-4 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-light-5/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    <span className="relative z-10">Continue Shopping</span>
                  </Link>
                  
                  <div className="text-center text-sm text-gray-5 pt-2">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-green rounded-full animate-pulse"></div>
                      <span>SSL Secured</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Cart;
