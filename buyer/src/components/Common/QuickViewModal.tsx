"use client";
import React, { useEffect, useState } from "react";

import { useModalContext } from "@/app/context/QuickViewModalContext";
import { AppDispatch, useAppSelector } from "@/redux/store";
import { addItemToCartAsync, selectCartItems, selectIsItemBeingAdded } from "@/redux/features/cart-slice";
import { addItemToWishlistAsync, removeItemFromWishlistAsync, selectIsItemInWishlist, selectWishlistLoading } from "@/redux/features/wishlist-slice";
import { useDispatch } from "react-redux";
import Image from "next/image";
import Link from "next/link";
import { usePreviewSlider } from "@/app/context/PreviewSliderContext";
import { resetQuickView } from "@/redux/features/quickView-slice";
import { updateproductDetails } from "@/redux/features/product-details";
import QuantityControl from "../Cart/QuantityControl";
import toast from "react-hot-toast";

const QuickViewModal = () => {
  const { isModalOpen, closeModal } = useModalContext();
  const { openPreviewModal } = usePreviewSlider();
  const [quantity, setQuantity] = useState(1);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const dispatch = useDispatch<AppDispatch>();

  // get the product data
  const product = useAppSelector((state) => state.quickViewReducer.value);
  const cartItems = useAppSelector(selectCartItems);
  const isItemBeingAdded = useAppSelector(state => product ? selectIsItemBeingAdded(state, product.id) : false);
  const isInWishlist = useAppSelector(state => product ? selectIsItemInWishlist(state, product.id) : false);
  const isWishlistLoading = useAppSelector(selectWishlistLoading);

  // Debug logging for seller information in modal
  useEffect(() => {
    if (product && product.title) {
      console.log(`🚀 QuickView Modal Debug (${product.title}):`, {
        'Product sellerName': product.sellerName,
        'Product sellerMarketName': product.sellerMarketName,
        'Product sellerId': product.sellerId,
        'Full product object': product
      });
    }
  }, [product]);

  const [activePreview, setActivePreview] = useState(0);

  // Stock validation logic
  const availableStock = product?.quantityOfActiveCodes || 0;
  const cartItem = product ? cartItems.find((cartItem) => cartItem.listingId === product.id) : null;
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = availableStock === 0;
  const wouldExceedStock = quantityInCart + quantity > availableStock;
  const maxAddableQuantity = Math.max(1, availableStock - quantityInCart);

  // Reset quantity if it exceeds the available stock considering cart items
  useEffect(() => {
    if (quantity > maxAddableQuantity) {
      setQuantity(Math.max(1, maxAddableQuantity));
    }
  }, [quantity, maxAddableQuantity]);

  // preview modal
  const handlePreviewSlider = () => {
    dispatch(updateproductDetails(product));
    openPreviewModal();
  };

  // add to cart
  const handleAddToCart = () => {
    if (!product) {
      toast.error("Product not found");
      return;
    }

    if (!product.sellerId) {
      toast.error("Invalid product data");
      return;
    }

    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }

    if (wouldExceedStock) {
      const availableToAdd = availableStock - quantityInCart;
      if (availableToAdd <= 0) {
        toast.error(
          `You already have the maximum available quantity (${availableStock}) in your cart`
        );
      } else {
        toast.error(
          `Cannot add ${quantity} items. You can only add ${availableToAdd} more (${quantityInCart} already in cart, ${availableStock} available)`
        );
      }
      return;
    }

    if (isItemBeingAdded) {
      toast.error("This item is already being added to cart");
      return;
    }

    dispatch(
      addItemToCartAsync({
        listingId: product.id,
        title: product.title,
        price: product.price,
        discountedPrice: product.discountedPrice,
        quantity,
        imgs: product.imgs,
        sellerId: product.sellerId,
        availableStock: availableStock,
        listingSnapshot: {
          category: product.categoryName,
          platform: product.platform,
          region: product.region,
        },
      })
    );

    closeModal();
  };

  // toggle wishlist
  const handleToggleWishlist = async () => {
    if (product && !isWishlistLoading) {
      try {
        if (isInWishlist) {
          await dispatch(removeItemFromWishlistAsync(product.id)).unwrap();
          toast.success("Removed from wishlist!");
        } else {
          await dispatch(
            addItemToWishlistAsync({
              ...product,
              status: "available",
              quantity: 1,
            })
          ).unwrap();
          toast.success("Added to wishlist!");
        }
      } catch (error: any) {
        toast.error(error || "Failed to update wishlist");
      }
    }
  };

  // Calculate discount percentage
  const calculateDiscountPercentage = () => {
    if (
      product &&
      product.price &&
      product.discountedPrice &&
      product.price > product.discountedPrice
    ) {
      const discount =
        ((product.price - product.discountedPrice) / product.price) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  // Quantity control handlers
  const handleQuantityIncrease = () => {
    if (quantity < maxAddableQuantity) {
      setQuantity(quantity + 1);
    } else {
      const availableToAdd = availableStock - quantityInCart;
      if (availableToAdd <= 0) {
        toast.error(`Maximum available quantity (${availableStock}) already in cart`);
      } else {
        toast.error(`Cannot add more. Only ${availableToAdd} available (${quantityInCart} already in cart)`);
      }
    }
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(newQuantity);
  };

  useEffect(() => {
    // closing modal while clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (!event.target || !(event.target as Element).closest(".modal-content")) {
        closeModal();
      }
    }

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen, closeModal]);

  // Reset quantity when modal opens/closes or product changes
  useEffect(() => {
    if (isModalOpen && product) {
      setQuantity(1);
      setActivePreview(0);
      setIsDescriptionExpanded(false); // Reset description state
    }
  }, [isModalOpen, product?.id]);

  // Check if description needs expanding based on length
  const isDescriptionLong = product?.description && product.description.length > 200;

  return (
    <div
      className={`${
        isModalOpen ? "z-99999" : "hidden"
      } fixed top-0 left-0 overflow-y-auto no-scrollbar w-full h-screen sm:py-20 xl:py-25 2xl:py-[230px] bg-dark/70 sm:px-8 px-4 py-5`}
    >
      <div className="flex items-center justify-center ">
        <div className="w-full max-w-[1100px] rounded-xl shadow-3 bg-white p-7.5 relative modal-content">
          <button
            onClick={() => closeModal()}
            aria-label="button for close modal"
            className="absolute top-0 right-0 sm:top-6 sm:right-6 flex items-center justify-center w-10 h-10 rounded-full ease-in duration-150 bg-meta text-body hover:text-dark"
          >
            <svg
              className="fill-current"
              width="26"
              height="26"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.3108 13L19.2291 8.08167C19.5866 7.72417 19.5866 7.12833 19.2291 6.77083C19.0543 6.59895 18.8189 6.50262 18.5737 6.50262C18.3285 6.50262 18.0932 6.59895 17.9183 6.77083L13 11.6892L8.08164 6.77083C7.90679 6.59895 7.67142 6.50262 7.42623 6.50262C7.18104 6.50262 6.94566 6.59895 6.77081 6.77083C6.41331 7.12833 6.41331 7.72417 6.77081 8.08167L11.6891 13L6.77081 17.9183C6.41331 18.2758 6.41331 18.8717 6.77081 19.2292C7.12831 19.5867 7.72414 19.5867 8.08164 19.2292L13 14.3108L17.9183 19.2292C18.2758 19.5867 18.8716 19.5867 19.2291 19.2292C19.5866 18.8717 19.5866 18.2758 19.2291 17.9183L14.3108 13Z"
                fill=""
              />
            </svg>
          </button>

          <div className="flex flex-wrap items-center gap-12.5">
            <div className="max-w-[526px] w-full">
              <div className="flex gap-5">
                <div className="flex flex-col gap-5">
                  {product.imgs.thumbnails?.map((img, key) => (
                    <button
                      onClick={() => setActivePreview(key)}
                      key={key}
                      className={`flex items-center justify-center w-20 h-20 overflow-hidden rounded-lg bg-gray-1 ease-out duration-200 hover:border-2 hover:border-blue ${
                        activePreview === key && "border-2 border-blue"
                      }`}
                    >
                      <Image
                        src={img || ""}
                        alt="thumbnail"
                        width={61}
                        height={61}
                        className="aspect-square"
                      />
                    </button>
                  ))}
                </div>

                <div className="relative z-1 overflow-hidden flex items-center justify-center w-full sm:min-h-[508px] bg-gray-1 rounded-lg border border-gray-3">
                  <div>
                    <button
                      onClick={handlePreviewSlider}
                      aria-label="button for zoom"
                      className="gallery__Image w-10 h-10 rounded-[5px] bg-white shadow-1 flex items-center justify-center ease-out duration-200 text-dark hover:text-blue absolute top-4 lg:top-8 right-4 lg:right-8 z-50"
                    >
                      <svg
                        className="fill-current"
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M9.11493 1.14581L9.16665 1.14581C9.54634 1.14581 9.85415 1.45362 9.85415 1.83331C9.85415 2.21301 9.54634 2.52081 9.16665 2.52081C7.41873 2.52081 6.17695 2.52227 5.23492 2.64893C4.31268 2.77292 3.78133 3.00545 3.39339 3.39339C3.00545 3.78133 2.77292 4.31268 2.64893 5.23492C2.52227 6.17695 2.52081 7.41873 2.52081 9.16665C2.52081 9.54634 2.21301 9.85415 1.83331 9.85415C1.45362 9.85415 1.14581 9.54634 1.14581 9.16665L1.14581 9.11493C1.1458 7.43032 1.14579 6.09599 1.28619 5.05171C1.43068 3.97699 1.73512 3.10712 2.42112 2.42112C3.10712 1.73512 3.97699 1.43068 5.05171 1.28619C6.09599 1.14579 7.43032 1.1458 9.11493 1.14581ZM16.765 2.64893C15.823 2.52227 14.5812 2.52081 12.8333 2.52081C12.4536 2.52081 12.1458 2.21301 12.1458 1.83331C12.1458 1.45362 12.4536 1.14581 12.8333 1.14581L12.885 1.14581C14.5696 1.1458 15.904 1.14579 16.9483 1.28619C18.023 1.43068 18.8928 1.73512 19.5788 2.42112C20.2648 3.10712 20.5693 3.97699 20.7138 5.05171C20.8542 6.09599 20.8542 7.43032 20.8541 9.11494V9.16665C20.8541 9.54634 20.5463 9.85415 20.1666 9.85415C19.787 9.85415 19.4791 9.54634 19.4791 9.16665C19.4791 7.41873 19.4777 6.17695 19.351 5.23492C19.227 4.31268 18.9945 3.78133 18.6066 3.39339C18.2186 3.00545 17.6873 2.77292 16.765 2.64893ZM1.83331 12.1458C2.21301 12.1458 2.52081 12.4536 2.52081 12.8333C2.52081 14.5812 2.52227 15.823 2.64893 16.765C2.77292 17.6873 3.00545 18.2186 3.39339 18.6066C3.78133 18.9945 4.31268 19.227 5.23492 19.351C6.17695 19.4777 7.41873 19.4791 9.16665 19.4791C9.54634 19.4791 9.85415 19.787 9.85415 20.1666C9.85415 20.5463 9.54634 20.8541 9.16665 20.8541H9.11494C7.43032 20.8542 6.09599 20.8542 5.05171 20.7138C3.97699 20.5693 3.10712 20.2648 2.42112 19.5788C1.73512 18.8928 1.43068 18.023 1.28619 16.9483C1.14579 15.904 1.1458 14.5696 1.14581 12.885L1.14581 12.8333C1.14581 12.4536 1.45362 12.1458 1.83331 12.1458ZM20.1666 12.1458C20.5463 12.1458 20.8541 12.4536 20.8541 12.8333V12.885C20.8542 14.5696 20.8542 15.904 20.7138 16.9483C20.5693 18.023 20.2648 18.8928 19.5788 19.5788C18.8928 20.2648 18.023 20.5693 16.9483 20.7138C15.904 20.8542 14.5696 20.8542 12.885 20.8541H12.8333C12.4536 20.8541 12.1458 20.5463 12.1458 20.1666C12.1458 19.787 12.4536 19.4791 12.8333 19.4791C14.5812 19.4791 15.823 19.4777 16.765 19.351C17.6873 19.227 18.2186 18.9945 18.6066 18.6066C18.9945 18.2186 19.227 17.6873 19.351 16.765C19.4777 15.823 19.4791 14.5812 19.4791 12.8333C19.4791 12.4536 19.787 12.1458 20.1666 12.1458Z"
                          fill=""
                        />
                      </svg>
                    </button>

                    <Image
                      src={product?.imgs?.previews?.[activePreview]}
                      alt="products-details"
                      width={400}
                      height={400}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-[445px] w-full">
              {/* Discount Badge */}
              {calculateDiscountPercentage() > 0 && (
                <span className="inline-block text-custom-xs font-medium text-white py-1 px-3 bg-green mb-6.5">
                  SAVE {calculateDiscountPercentage()}% OFF
                </span>
              )}

              {/* Product Title */}
              <h3 className="font-semibold text-xl xl:text-heading-5 text-dark mb-4 line-clamp-2">
                {product.title}
              </h3>

              {/* Category and Platform Info */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {product.categoryName && (
                  <span className="inline-flex items-center gap-1 bg-blue-light-5 text-blue-dark px-2 py-1 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
                    </svg>
                    {product.categoryName}
                  </span>
                )}
                
                {product.platform && (
                  <span className="inline-flex items-center gap-1 bg-green-light-5 text-green-dark px-2 py-1 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 1a1 1 0 100 2h2a1 1 0 100-2h-2z" clipRule="evenodd"/>
                    </svg>
                    {product.platform}
                  </span>
                )}

                {product.region && (
                  <span className="inline-flex items-center gap-1 bg-teal-light-5 text-teal-dark px-2 py-1 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd"/>
                    </svg>
                    {product.region}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-5 mb-6">
                <div className="flex items-center gap-1.5">
                  {/* <!-- stars --> */}
                  <div className="flex items-center gap-1">
                    <svg
                      className="fill-[#FFA645]"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_375_9172)">
                        <path
                          d="M16.7906 6.72187L11.7 5.93438L9.39377 1.09688C9.22502 0.759375 8.77502 0.759375 8.60627 1.09688L6.30002 5.9625L1.23752 6.72187C0.871891 6.77812 0.731266 7.25625 1.01252 7.50938L4.69689 11.3063L3.82502 16.6219C3.76877 16.9875 4.13439 17.2969 4.47189 17.0719L9.05627 14.5687L13.6125 17.0719C13.9219 17.2406 14.3156 16.9594 14.2313 16.6219L13.3594 11.3063L17.0438 7.50938C17.2688 7.25625 17.1563 6.77812 16.7906 6.72187Z"
                          fill=""
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_375_9172">
                          <rect width="18" height="18" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>

                    <svg
                      className="fill-[#FFA645]"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_375_9172)">
                        <path
                          d="M16.7906 6.72187L11.7 5.93438L9.39377 1.09688C9.22502 0.759375 8.77502 0.759375 8.60627 1.09688L6.30002 5.9625L1.23752 6.72187C0.871891 6.77812 0.731266 7.25625 1.01252 7.50938L4.69689 11.3063L3.82502 16.6219C3.76877 16.9875 4.13439 17.2969 4.47189 17.0719L9.05627 14.5687L13.6125 17.0719C13.9219 17.2406 14.3156 16.9594 14.2313 16.6219L13.3594 11.3063L17.0438 7.50938C17.2688 7.25625 17.1563 6.77812 16.7906 6.72187Z"
                          fill=""
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_375_9172">
                          <rect width="18" height="18" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>

                    <svg
                      className="fill-[#FFA645]"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_375_9172)">
                        <path
                          d="M16.7906 6.72187L11.7 5.93438L9.39377 1.09688C9.22502 0.759375 8.77502 0.759375 8.60627 1.09688L6.30002 5.9625L1.23752 6.72187C0.871891 6.77812 0.731266 7.25625 1.01252 7.50938L4.69689 11.3063L3.82502 16.6219C3.76877 16.9875 4.13439 17.2969 4.47189 17.0719L9.05627 14.5687L13.6125 17.0719C13.9219 17.2406 14.3156 16.9594 14.2313 16.6219L13.3594 11.3063L17.0438 7.50938C17.2688 7.25625 17.1563 6.77812 16.7906 6.72187Z"
                          fill=""
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_375_9172">
                          <rect width="18" height="18" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>

                    <svg
                      className="fill-gray-4"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_375_9172)">
                        <path
                          d="M16.7906 6.72187L11.7 5.93438L9.39377 1.09688C9.22502 0.759375 8.77502 0.759375 8.60627 1.09688L6.30002 5.9625L1.23752 6.72187C0.871891 6.77812 0.731266 7.25625 1.01252 7.50938L4.69689 11.3063L3.82502 16.6219C3.76877 16.9875 4.13439 17.2969 4.47189 17.0719L9.05627 14.5687L13.6125 17.0719C13.9219 17.2406 14.3156 16.9594 14.2313 16.6219L13.3594 11.3063L17.0438 7.50938C17.2688 7.25625 17.1563 6.77812 16.7906 6.72187Z"
                          fill=""
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_375_9172">
                          <rect width="18" height="18" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>

                    <svg
                      className="fill-gray-4"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g clipPath="url(#clip0_375_9172)">
                        <path
                          d="M16.7906 6.72187L11.7 5.93438L9.39377 1.09688C9.22502 0.759375 8.77502 0.759375 8.60627 1.09688L6.30002 5.9625L1.23752 6.72187C0.871891 6.77812 0.731266 7.25625 1.01252 7.50938L4.69689 11.3063L3.82502 16.6219C3.76877 16.9875 4.13439 17.2969 4.47189 17.0719L9.05627 14.5687L13.6125 17.0719C13.9219 17.2406 14.3156 16.9594 14.2313 16.6219L13.3594 11.3063L17.0438 7.50938C17.2688 7.25625 17.1563 6.77812 16.7906 6.72187Z"
                          fill=""
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_375_9172">
                          <rect width="18" height="18" fill="white" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>

                  <span>
                    <span className="font-medium text-dark"> 4.7 Rating </span>
                    <span className="text-dark-2"> (5 reviews) </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_375_9221)">
                      <path
                        d="M10 0.5625C4.78125 0.5625 0.5625 4.78125 0.5625 10C0.5625 15.2188 4.78125 19.4688 10 19.4688C15.2188 19.4688 19.4688 15.2188 19.4688 10C19.4688 4.78125 15.2188 0.5625 10 0.5625ZM10 18.0625C5.5625 18.0625 1.96875 14.4375 1.96875 10C1.96875 5.5625 5.5625 1.96875 10 1.96875C14.4375 1.96875 18.0625 5.59375 18.0625 10.0312C18.0625 14.4375 14.4375 18.0625 10 18.0625Z"
                        fill={product.quantityOfActiveCodes && product.quantityOfActiveCodes > 0 ? "#22AD5C" : "#EF4444"}
                      />
                      <path
                        d="M12.6875 7.09374L8.9688 10.7187L7.2813 9.06249C7.00005 8.78124 6.56255 8.81249 6.2813 9.06249C6.00005 9.34374 6.0313 9.78124 6.2813 10.0625L8.2813 12C8.4688 12.1875 8.7188 12.2812 8.9688 12.2812C9.2188 12.2812 9.4688 12.1875 9.6563 12L13.6875 8.12499C13.9688 7.84374 13.9688 7.40624 13.6875 7.12499C13.4063 6.84374 12.9688 6.84374 12.6875 7.09374Z"
                        fill={product.quantityOfActiveCodes && product.quantityOfActiveCodes > 0 ? "#22AD5C" : "#EF4444"}
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_375_9221">
                        <rect width="20" height="20" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>

                  <span className="font-medium text-dark"> 
                    {product.quantityOfActiveCodes && product.quantityOfActiveCodes > 0 
                      ? `${product.quantityOfActiveCodes} codes available` 
                      : 'Out of Stock'
                    }
                  </span>
                </div>
              </div>

              {/* Product Description with Accordion */}
              <div className="mb-6">
                {product.description ? (
                  <div>
                    <div 
                      className={`text-dark-3 leading-relaxed prose prose-sm max-w-none transition-all duration-300 ${
                        isDescriptionExpanded || !isDescriptionLong ? '' : 'line-clamp-3'
                      }`}
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                    
                    {/* Read More/Less Button */}
                    {isDescriptionLong && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="inline-flex items-center gap-1 mt-2 text-blue hover:text-blue-dark transition-colors duration-200 text-sm font-medium"
                      >
                        <span>{isDescriptionExpanded ? 'Show Less' : 'Read More'}</span>
                        <svg 
                          className={`w-4 h-4 transform transition-transform duration-200 ${
                            isDescriptionExpanded ? 'rotate-180' : ''
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-dark-4 italic">
                    Instant digital delivery of your {product.categoryName || 'digital code'}. 
                    Verified by our team for authenticity and quality.
                  </p>
                )}
                
                {/* Seller Info */}
                {product.sellerMarketName && (
                  <div className="flex items-center gap-2 mt-3 p-2 bg-gray-1 rounded-lg">
                    <svg className="w-4 h-4 text-blue" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm">
                      <span className="text-dark-4">Sold by </span>
                      <span className="font-medium text-dark">{product.sellerMarketName}</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-between gap-5 mt-6 mb-7.5">
                <div>
                  <h4 className="font-semibold text-lg text-dark mb-3.5">
                    Price
                  </h4>

                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-dark text-xl xl:text-heading-4">
                      ${product.discountedPrice}
                    </span>
                    <span className="font-medium text-dark-4 text-lg xl:text-2xl line-through">
                      ${product.price}
                    </span>
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-lg text-dark mb-3.5">
                    Quantity
                  </h4>

                  <QuantityControl
                    quantity={quantity}
                    onIncrease={handleQuantityIncrease}
                    onDecrease={handleQuantityDecrease}
                    min={1}
                    max={maxAddableQuantity}
                    disabled={isOutOfStock}
                    handleQuantityChange={handleQuantityChange}
                    showMaximumPulse={true}
                  />

                  {/* Stock Information */}
                  <div className="mt-3 text-sm">
                    {quantityInCart > 0 && (
                      <p className="text-blue mb-1">
                        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 1a1 1 0 100 2h2a1 1 0 100-2h-2z" clipRule="evenodd"/>
                        </svg>
                        {quantityInCart} already in cart
                      </p>
                    )}
                    {isOutOfStock && (
                      <p className="text-red font-medium">
                        <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                        </svg>
                        Out of stock
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                {/* Add to Cart Button - Primary Action */}
                <button
                  disabled={isItemBeingAdded || isOutOfStock || wouldExceedStock || quantity === 0}
                  onClick={handleAddToCart}
                  className={`inline-flex items-center justify-center gap-2 font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 transform disabled:cursor-not-allowed ${
                    isOutOfStock || wouldExceedStock
                      ? 'bg-gray-200 text-gray-500 shadow-none'
                      : isItemBeingAdded
                      ? 'bg-blue-light text-blue shadow-blue/20'
                      : 'text-white bg-gradient-to-r from-blue to-blue-dark hover:from-blue-dark hover:to-blue shadow-blue/30 hover:shadow-blue/50 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isItemBeingAdded && (
                    <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span className="truncate">
                    {isItemBeingAdded
                      ? 'Adding...'
                      : isOutOfStock
                      ? 'Out of Stock'
                      : wouldExceedStock
                      ? 'Max Reached'
                      : quantityInCart > 0
                      ? `Add ${quantity} More`
                      : `Add ${quantity} to Cart`
                    }
                  </span>
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={handleToggleWishlist}
                  disabled={isWishlistLoading}
                  className={`inline-flex items-center justify-center gap-2 font-semibold py-4 px-6 rounded-xl border-2 shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 ${
                    isInWishlist
                      ? 'border-red bg-red text-white hover:border-red-dark hover:bg-red-dark hover:shadow-red/30'
                      : 'border-gray-3 bg-white text-dark hover:border-red hover:text-red hover:shadow-red/20'
                  }`}
                  title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  {isWishlistLoading ? (
                    // Loading spinner
                    <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : isInWishlist ? (
                    // Filled heart icon for wishlisted items
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  ) : (
                    // Outline heart icon for non-wishlisted items
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                  <span className="truncate">
                    {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
