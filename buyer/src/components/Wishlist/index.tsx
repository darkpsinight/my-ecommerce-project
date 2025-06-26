"use client";
import React from "react";
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { selectWishlistItems, selectWishlistLoading, selectWishlistError, selectWishlistCount, clearWishlistAsync } from "@/redux/features/wishlist-slice";
import { selectIsAuthenticated } from "@/redux/features/auth-slice";
import SingleItem from "./SingleItem";
import PageContainer from "../Common/PageContainer";
import Link from "next/link";
import toast from "react-hot-toast";

export const Wishlist = () => {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector(selectWishlistItems);
  const isLoading = useAppSelector(selectWishlistLoading);
  const error = useAppSelector(selectWishlistError);
  const wishlistCount = useAppSelector(selectWishlistCount);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Handle clear wishlist
  const handleClearWishlist = async () => {
    if (wishlistItems.length === 0) {
      toast.error("Your wishlist is already empty");
      return;
    }

    if (window.confirm("Are you sure you want to clear your entire wishlist? This action cannot be undone.")) {
      try {
        await dispatch(clearWishlistAsync()).unwrap();
        toast.success("Wishlist cleared successfully!");
      } catch (error: any) {
        toast.error(error || "Failed to clear wishlist");
      }
    }
  };

  // Authentication check
  if (!isAuthenticated) {
    return (
      <PageContainer>
        <section className="overflow-hidden pt-[95px] py-20 bg-gray-2">
          <div className="max-w-[800px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="bg-white rounded-2xl shadow-1 p-8 text-center">
              <div className="mb-6">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
                <p className="text-gray-600 mb-6">
                  Please sign in to view and manage your wishlist. Save your favorite digital codes and games for later!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/signin"
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue text-white font-medium rounded-xl hover:bg-blue-dark transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <PageContainer>
        <section className="overflow-hidden pt-[95px] py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="flex flex-wrap items-center justify-between gap-5 mb-7.5">
              <h2 className="font-medium text-dark text-2xl">Your Wishlist</h2>
              <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>

            <div className="bg-white rounded-[10px] shadow-1">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[1170px]">
                  {/* Loading skeleton */}
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="flex items-center border-t border-gray-3 py-5 px-10 animate-pulse">
                      <div className="min-w-[83px] h-12 bg-gray-200 rounded"></div>
                      <div className="min-w-[387px] ml-4">
                        <div className="h-6 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="min-w-[205px] h-6 bg-gray-200 rounded"></div>
                      <div className="min-w-[265px] h-6 bg-gray-200 rounded"></div>
                      <div className="min-w-[150px] h-10 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <PageContainer>
        <section className="overflow-hidden pt-[95px] py-20 bg-gray-2">
          <div className="max-w-[800px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="bg-white rounded-2xl shadow-1 p-8 text-center">
              <div className="mb-6">
                <svg
                  className="w-16 h-16 text-red-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue text-white font-medium rounded-xl hover:bg-blue-dark transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    );
  }

  // Empty wishlist state
  if (wishlistItems.length === 0) {
    return (
      <PageContainer>
        <section className="overflow-hidden pt-[95px] py-20 bg-gray-2">
          <div className="max-w-[800px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="bg-white rounded-2xl shadow-1 p-8 text-center">
              <div className="mb-6">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
                <p className="text-gray-600 mb-6">
                  Start building your wishlist by browsing our marketplace and saving items you love!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center px-6 py-3 bg-blue text-white font-medium rounded-xl hover:bg-blue-dark transition-colors"
                  >
                    Browse Products
                  </Link>
                  <Link
                    href="/marketplaces"
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Explore Marketplaces
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    );
  }

  // Main wishlist content
  return (
    <>
      <PageContainer>
        <section className="overflow-hidden pt-[95px] py-20 bg-gray-2">
          <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
            <div className="flex flex-wrap items-center justify-between gap-5 mb-7.5">
              <div>
                <h2 className="font-medium text-dark text-2xl mb-2">Your Wishlist</h2>
                <p className="text-gray-600 text-sm">
                  {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'} saved for later
                </p>
              </div>
              <button 
                onClick={handleClearWishlist}
                disabled={isLoading || wishlistItems.length === 0}
                className="text-red hover:text-red-dark font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Clear Wishlist
              </button>
            </div>

            <div className="bg-white rounded-[10px] shadow-1">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[1170px]">
                  {/* <!-- table header --> */}
                  <div className="flex items-center py-5.5 px-10 bg-gray-50 border-b border-gray-200">
                    <div className="min-w-[83px]"></div>
                    <div className="min-w-[387px]">
                      <p className="text-dark font-semibold">Product</p>
                    </div>

                    <div className="min-w-[205px]">
                      <p className="text-dark font-semibold">Unit Price</p>
                    </div>

                    <div className="min-w-[265px]">
                      <p className="text-dark font-semibold">Stock Status</p>
                    </div>

                    <div className="min-w-[150px]">
                      <p className="text-dark font-semibold text-right">Action</p>
                    </div>
                  </div>

                  {/* <!-- wish items --> */}
                  {wishlistItems.map((item, key) => (
                    <SingleItem item={item} key={key} />
                  ))}
                </div>
              </div>

              {/* Wishlist summary */}
              <div className="border-t border-gray-200 p-6 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <p>Items in your wishlist are saved to your account and synced across all devices.</p>
                    <p className="mt-1">Add items to cart when you&apos;re ready to purchase!</p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/products"
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Continue Shopping
                    </Link>
                    <Link
                      href="/cart"
                      className="inline-flex items-center justify-center px-4 py-2 bg-blue text-white font-medium rounded-lg hover:bg-blue-dark transition-colors"
                    >
                      View Cart
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>
    </>
  );
};
