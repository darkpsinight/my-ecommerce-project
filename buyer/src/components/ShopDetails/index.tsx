"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Newsletter from "../Common/Newsletter";
import RecentlyViewedItems from "./RecentlyViewed";
import QuantityControl from "../Cart/QuantityControl";

import { useAppSelector } from "@/redux/store";
import { getProductById } from "@/services/product";
import { Product } from "@/types/product";
import { useRouter, useSearchParams } from "next/navigation";
import { addItemToCart } from "@/redux/features/cart-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import {
  updateproductDetails,
  clearProductDetails,
} from "@/redux/features/product-details";
import { addRecentlyViewedProduct } from "@/redux/features/recently-viewed-slice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import PageContainer from "../Common/PageContainer";
import ProductDetailSkeleton from "../Common/ProductDetailSkeleton";

const ShopDetails = () => {
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("tabOne");
  const [productData, setProductData] = useState<Product | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const tabs = [
    {
      id: "tabOne",
      title: "Description",
    },
    {
      id: "tabTwo",
      title: "Additional Information",
    },
    {
      id: "tabThree",
      title: "Reviews",
    },
  ];

  // Get product from Redux store
  const productFromStorage = useAppSelector(
    (state) => state.productDetailsReducer.value
  );

  // Initialize fallback product
  const [fallbackProduct, setFallbackProduct] = useState<Product | null>(null);

  // Set fallback product when component mounts or productId changes
  useEffect(() => {
    // Only use localStorage as fallback if no product ID is provided
    if (!productId && typeof window !== "undefined") {
      const storedProduct = localStorage.getItem("productDetails");
      if (storedProduct) {
        try {
          const parsedProduct = JSON.parse(storedProduct);
          setFallbackProduct(parsedProduct);
        } catch (error) {
          console.error("Error parsing stored product:", error);
          setFallbackProduct(productFromStorage);
        }
      } else {
        setFallbackProduct(productFromStorage);
      }
    } else {
      // If we have a productId, don't use fallback
      setFallbackProduct(null);
    }
  }, [productId, productFromStorage]);

  // Clear product details when component unmounts
  useEffect(() => {
    return () => {
      console.log("ShopDetails component unmounting, clearing product details");
      dispatch(clearProductDetails());

      // Also clear localStorage to prevent stale data
      if (typeof window !== "undefined") {
        localStorage.removeItem("productDetails");
      }
    };
  }, [dispatch]);

  // Fetch product data if ID is provided, otherwise use fallback
  useEffect(() => {
    // Create a flag to track if the component is still mounted
    let isMounted = true;

    const fetchProductData = async () => {
      if (!isMounted) return;
      setLoading(true);

      if (productId) {
        try {
          console.log("Fetching product with ID:", productId);

          // Check if the product ID matches what's already in Redux
          const currentProductId = productFromStorage.id?.toString();
          const shouldBypassCache = currentProductId !== productId;

          // Only force a fresh fetch if the product ID has changed
          const data = await getProductById(productId, shouldBypassCache);

          // Only update state if component is still mounted
          if (!isMounted) return;

          if (data) {
            console.log("Product data fetched successfully:", data.title);
            setProductData(data);

            // Save to localStorage for persistence
            localStorage.setItem("productDetails", JSON.stringify(data));

            // Only update Redux store if the product ID has changed
            if (currentProductId !== productId) {
              dispatch(updateproductDetails({ ...data }));
            }

            // Add to recently viewed products
            dispatch(addRecentlyViewedProduct({ ...data }));
          } else {
            console.log("No product data found, using fallback");
            setProductData(fallbackProduct);
          }
        } catch (error) {
          // Only update state if component is still mounted
          if (!isMounted) return;

          console.error("Error fetching product:", error);
          setProductData(fallbackProduct);
        }
      } else {
        console.log("No product ID provided, using fallback product");
        setProductData(fallbackProduct);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    // Reset product data when productId changes
    setProductData(null);

    fetchProductData();

    // Cleanup function to set the flag to false when component unmounts
    return () => {
      isMounted = false;
    };
  }, [productId, dispatch, productFromStorage.id, fallbackProduct]);

  // Use the fetched product data or fallback
  const product = productData || fallbackProduct;

  // Add to cart handler
  const handleAddToCart = () => {
    if (product) {
      dispatch(
        addItemToCart({
          listingId: product.id,
          title: product.title,
          price: product.price,
          discountedPrice: product.discountedPrice,
          quantity: quantity,
          imgs: product.imgs,
          sellerId: product.sellerId || "",
          listingSnapshot: {
            category: product.categoryName,
            platform: product.platform,
            region: product.region,
          },
        })
      );
    }
  };

  // Add to wishlist handler
  const handleAddToWishlist = () => {
    if (product) {
      dispatch(
        addItemToWishlist({
          ...product,
          status: "available",
          quantity: 1,
        })
      );
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

  // Loading state
  if (loading) {
    return <ProductDetailSkeleton />;
  }

  // If no product data is available
  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-[600px] bg-gray-2">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-dark mb-4">
            Product Not Found
          </h2>
          <p className="text-dark-4 mb-6">
            The product you&apos;re looking for is not available.
          </p>
          <button
            onClick={() => router.push("/shop-with-sidebar")}
            className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageContainer>
        <section className="overflow-hidden pt-16 pb-1 sm:pb-2 bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="flex flex-col xl:flex-row gap-8 xl:gap-12">
            {/* Product Image Section */}
            <div className="xl:max-w-[600px] w-full">
              <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden group">
                {/* Discount Badge */}
                {product.price && product.price > product.discountedPrice && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="inline-flex font-semibold text-sm text-white bg-gradient-to-r from-red to-red-dark rounded-full py-2 px-4 shadow-lg">
                      {calculateDiscountPercentage()}% OFF
                    </div>
                  </div>
                )}

                {/* Product Image */}
                <div className="aspect-square lg:min-h-[500px] p-8 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <Image
                    src={
                      product.imgs?.previews?.[0] ||
                      product.thumbnailUrl ||
                      "/images/products/placeholder.png"
                    }
                    alt={product.title || "Product details"}
                    width={500}
                    height={500}
                    className="object-contain max-h-full w-full transition-all duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg p-6 lg:p-8">
              {/* Product Header */}
              <div className="mb-6">
                <h1 className="font-bold text-2xl lg:text-3xl xl:text-4xl text-gray-900 mb-3 leading-tight">
                  {product.title}
                </h1>

                {/* Category & Seller Info */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {product.categoryName && (
                    <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 rounded-full">
                      <span className="text-blue-600 text-sm font-medium">
                        {product.categoryName}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">by</span>
                    <span className="text-gray-900 font-semibold">
                      {product.sellerName || "Michael"}
                    </span>
                    {product.isSellerVerified && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-green-600"
                        >
                          <path
                            d="M12 2L4 5.4V11.8C4 16.4 7.4 20.5 12 21.5C16.6 20.5 20 16.4 20 11.8V5.4L12 2ZM10.5 16.5L6.5 12.5L7.9 11.1L10.5 13.7L16.1 8.1L17.5 9.5L10.5 16.5Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="text-xs text-green-600 font-medium">
                          Verified
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating & Reviews */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, index) => (
                      <svg
                        key={index}
                        className="fill-yellow-400"
                        width="16"
                        height="16"
                        viewBox="0 0 18 18"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16.7906 6.72187L11.7 5.93438L9.39377 1.09688C9.22502 0.759375 8.77502 0.759375 8.60627 1.09688L6.30002 5.9625L1.23752 6.72187C0.871891 6.77812 0.731266 7.25625 1.01252 7.50938L4.69689 11.3063L3.82502 16.6219C3.76877 16.9875 4.13439 17.2969 4.47189 17.0719L9.05627 14.5687L13.6125 17.0719C13.9219 17.2406 14.3156 16.9594 14.2313 16.6219L13.3594 11.3063L17.0438 7.50938C17.2688 7.25625 17.1563 6.77812 16.7906 6.72187Z"
                          fill=""
                        />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-600 text-sm">
                    5.0 ({product.reviews || 0} reviews)
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-green-500"
                  >
                    <g clipPath="url(#clip0_375_9221)">
                      <path
                        d="M10 0C15.5228 0 20 4.47715 20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0Z"
                        fill="#22AD5C"
                      />
                      <path
                        d="M12.6875 7.09374L8.9688 10.7187L7.2813 9.06249C7.00005 8.78124 6.56255 8.81249 6.2813 9.06249C6.00005 9.34374 6.0313 9.78124 6.2813 10.0625L8.2813 12C8.4688 12.1875 8.7188 12.2812 8.9688 12.2812C9.2188 12.2812 9.4688 12.1875 9.6563 12L13.6875 8.12499C13.9688 7.84374 13.9688 7.40624 13.6875 7.12499C13.4063 6.84374 12.9688 6.84374 12.6875 7.09374Z"
                        fill="#FFFFFF"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_375_9221">
                        <rect width="20" height="20" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span className="text-green-600 font-medium text-sm">
                    In Stock
                  </span>
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-8">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl lg:text-4xl font-bold text-gray-900">
                    ${product.discountedPrice.toFixed(2)}
                  </span>
                  {product.price && product.price > product.discountedPrice && (
                    <span className="text-xl text-gray-400 line-through">
                      ${product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                {product.price && product.price > product.discountedPrice && (
                  <p className="text-green-600 font-medium">
                    You save $
                    {(product.price - product.discountedPrice).toFixed(2)} (
                    {calculateDiscountPercentage()}%)
                  </p>
                )}
              </div>

              {/* Product Features */}
              <div className="mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.autoDelivery && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-blue-600"
                        >
                          <path
                            d="M13.3589 8.35863C13.603 8.11455 13.603 7.71882 13.3589 7.47475C13.1149 7.23067 12.7191 7.23067 12.4751 7.47475L8.75033 11.1995L7.5256 9.97474C7.28152 9.73067 6.8858 9.73067 6.64172 9.97474C6.39764 10.2188 6.39764 10.6146 6.64172 10.8586L8.30838 12.5253C8.55246 12.7694 8.94819 12.7694 9.19227 12.5253L13.3589 8.35863Z"
                            fill="currentColor"
                          />
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M10.0003 1.04169C5.05277 1.04169 1.04199 5.05247 1.04199 10C1.04199 14.9476 5.05277 18.9584 10.0003 18.9584C14.9479 18.9584 18.9587 14.9476 18.9587 10C18.9587 5.05247 14.9479 1.04169 10.0003 1.04169ZM2.29199 10C2.29199 5.74283 5.74313 2.29169 10.0003 2.29169C14.2575 2.29169 17.7087 5.74283 17.7087 10C17.7087 14.2572 14.2575 17.7084 10.0003 17.7084C5.74313 17.7084 2.29199 14.2572 2.29199 10Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          Instant Delivery
                        </p>
                        <p className="text-xs text-blue-600">
                          Auto-delivered after payment
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-gray-600"
                      >
                        <path
                          d="M10 2C14.42 2 18 5.58 18 10C18 14.42 14.42 18 10 18C5.58 18 2 14.42 2 10C2 5.58 5.58 2 10 2ZM10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0Z"
                          fill="currentColor"
                        />
                        <path
                          d="M10 5C10.55 5 11 5.45 11 6V10C11 10.55 10.55 11 10 11C9.45 11 9 10.55 9 10V6C9 5.45 9.45 5 10 5Z"
                          fill="currentColor"
                        />
                        <circle cx="10" cy="14" r="1" fill="currentColor" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Platform
                      </p>
                      <p className="text-xs text-gray-600">
                        {product.platform || "Global"}
                      </p>
                    </div>
                  </div>

                  {product.isRegionLocked && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-orange-600"
                        >
                          <path
                            d="M10 2C14.42 2 18 5.58 18 10C18 14.42 14.42 18 10 18C5.58 18 2 14.42 2 10C2 5.58 5.58 2 10 2ZM10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-orange-900">
                          Region
                        </p>
                        <p className="text-xs text-orange-600">
                          {product.region || "Region Locked"}
                        </p>
                      </div>
                    </div>
                  )}

                  {product.supportedLanguages &&
                    product.supportedLanguages.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-green-600"
                          >
                            <path
                              d="M2.5 7.5C2.5 6.119 3.619 5 5 5H15C16.381 5 17.5 6.119 17.5 7.5V12.5C17.5 13.881 16.381 15 15 15H5C3.619 15 2.5 13.881 2.5 12.5V7.5Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                            />
                            <path
                              d="M7 8.5V11.5M10 8.5V11.5M13 8.5V11.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-900">
                            Languages
                          </p>
                          <p className="text-xs text-green-600">
                            {product.supportedLanguages.slice(0, 2).join(", ")}
                            {product.supportedLanguages.length > 2
                              ? ` +${product.supportedLanguages.length - 2}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Info */}
              <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      Stock Information
                    </h4>
                    <p className="text-sm text-gray-600">
                      {product.quantityOfActiveCodes || 0} active codes
                      available
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {product.quantityOfActiveCodes || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      of {product.quantityOfAllCodes || 0} total
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity and Actions */}
              <div className="border-t pt-8">
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-gray-900">
                      Quantity:
                    </label>
                    <QuantityControl
                      quantity={quantity}
                      onIncrease={() =>
                        setQuantity((prev) =>
                          Math.min(prev + 1, product.quantityOfActiveCodes || 1)
                        )
                      }
                      onDecrease={() =>
                        setQuantity((prev) => Math.max(prev - 1, 1))
                      }
                      min={1}
                      max={product.quantityOfActiveCodes || 1}
                      disabled={
                        !product.quantityOfActiveCodes ||
                        product.quantityOfActiveCodes === 0
                      }
                      handleQuantityChange={setQuantity}
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    Total:{" "}
                    <span className="font-semibold text-gray-900">
                      ${(product.discountedPrice * quantity).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={
                      !product.quantityOfActiveCodes ||
                      product.quantityOfActiveCodes === 0
                    }
                    className="flex-1 min-w-[200px] bg-gradient-to-r from-blue to-blue-dark hover:from-blue-dark hover:to-blue-light disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                  >
                    {!product.quantityOfActiveCodes ||
                    product.quantityOfActiveCodes === 0
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </button>

                  <button
                    onClick={handleAddToWishlist}
                    className="flex items-center justify-center w-14 h-14 bg-white border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                    aria-label="Add to wishlist"
                  >
                    <svg
                      className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors"
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
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>

      <PageContainer>
        <section className="-mt-30 sm:mt-4 bg-white rounded-xl">
          {/* <!--== tab header start ==--> */}
          <div className="flex items-center bg-white  border-gray-200 rounded-2xl shadow-lg gap-1 p-2 mb-8">
            {tabs.map((item, key) => (
              <button
                key={key}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 font-medium text-xs sm:text-sm lg:text-base py-2 sm:py-3 px-2 sm:px-4 lg:px-6 rounded-xl transition-all duration-200 text-center ${
                  activeTab === item.id
                    ? "bg-blue text-white shadow-md font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
          {/* <!--== tab header end ==--> */}

          {/* <!--== tab content start ==--> */}
          {/* <!-- tab content one start --> */}
          <div>
            <div className={`${activeTab === "tabOne" ? "block" : "hidden"}`}>
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Product Description
                </h3>
                <div
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{
                    __html:
                      product.description ||
                      "No description available for this product.",
                  }}
                />
              </div>
            </div>
          </div>
          {/* <!-- tab content one end --> */}

          {/* <!-- tab content two start --> */}
          <div>
            <div className={`${activeTab === "tabTwo" ? "block" : "hidden"}`}>
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* <!-- info item --> */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-500 mb-1">
                      Platform
                    </div>
                    <div className="text-base font-medium text-gray-900">
                      {product.platform || "Global"}
                    </div>
                  </div>

                  {/* <!-- info item --> */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-500 mb-1">
                      Region
                    </div>
                    <div className="text-base font-medium text-gray-900">
                      {product.isRegionLocked
                        ? product.region || "Region Locked"
                        : "Global (No Region Lock)"}
                    </div>
                  </div>

                  {/* <!-- info item --> */}
                  {product.supportedLanguages &&
                    product.supportedLanguages.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm font-semibold text-gray-500 mb-1">
                          Supported Languages
                        </div>
                        <div className="text-base font-medium text-gray-900">
                          {product.supportedLanguages.join(", ")}
                        </div>
                      </div>
                    )}

                  {/* <!-- info item --> */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-500 mb-1">
                      Auto Delivery
                    </div>
                    <div className="text-base font-medium text-gray-900">
                      {product.autoDelivery
                        ? "Yes - Instant Delivery"
                        : "No - Manual Delivery"}
                    </div>
                  </div>

                  {/* <!-- info item --> */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-500 mb-1">
                      Seller
                    </div>
                    <div className="text-base font-medium text-gray-900 flex items-center gap-2">
                      {product.sellerName || "Michael"}
                      {product.isSellerVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-green-600"
                          >
                            <path
                              d="M12 2L4 5.4V11.8C4 16.4 7.4 20.5 12 21.5C16.6 20.5 20 16.4 20 11.8V5.4L12 2ZM10.5 16.5L6.5 12.5L7.9 11.1L10.5 13.7L16.1 8.1L17.5 9.5L10.5 16.5Z"
                              fill="currentColor"
                            />
                          </svg>
                          <span className="text-xs text-green-600 font-medium">
                            Verified
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* <!-- info item --> */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-semibold text-gray-500 mb-1">
                      Available Codes
                    </div>
                    <div className="text-base font-medium text-gray-900">
                      {product.quantityOfActiveCodes || 0} active /{" "}
                      {product.quantityOfAllCodes || 0} total
                    </div>
                  </div>

                  {/* <!-- info item --> */}
                  {product.categoryName && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-semibold text-gray-500 mb-1">
                        Category
                      </div>
                      <div className="text-base font-medium text-gray-900">
                        {product.categoryName}
                      </div>
                    </div>
                  )}

                  {/* <!-- info item --> */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-semibold text-gray-500 mb-2">
                        Tags
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 rounded-md bg-white text-gray-700 text-sm border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* <!-- tab content two end --> */}

          {/* <!-- tab content three start --> */}
          <div>
            <div className={`${activeTab === "tabThree" ? "block" : "hidden"}`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    {product.reviews || 0} Reviews for this product
                  </h3>

                  <div className="space-y-6">
                    {/* <!-- review item --> */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src="/images/users/user-01.jpg"
                            alt="author"
                            className="w-full h-full object-cover"
                            width={48}
                            height={48}
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                John Smith
                              </h4>
                              <p className="text-sm text-gray-500">
                                Verified Buyer
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, index) => (
                                <svg
                                  key={index}
                                  className="w-4 h-4 fill-yellow-400"
                                  viewBox="0 0 15 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                                    fill=""
                                  />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 leading-relaxed">
                            Fast delivery and the code worked without any
                            issues. The product description was accurate and I
                            got exactly what I expected. The platform-specific
                            instructions were very helpful. Would recommend!
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* <!-- review item --> */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src="/images/users/user-01.jpg"
                            alt="author"
                            className="w-full h-full object-cover"
                            width={48}
                            height={48}
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                Michael Chen
                              </h4>
                              <p className="text-sm text-gray-500">
                                Verified Buyer
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, index) => (
                                <svg
                                  key={index}
                                  className="w-4 h-4 fill-yellow-400"
                                  viewBox="0 0 15 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                                    fill=""
                                  />
                                </svg>
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-700 leading-relaxed">
                            I was hesitant at first, but this turned out to be a
                            great purchase. The code was delivered instantly
                            after payment, and activation was straightforward.
                            The seller even followed up to make sure everything
                            was working properly. Five stars!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Write a Review
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Share your experience with this digital product. Required
                      fields are marked *
                    </p>

                    <form className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                          Your Rating*
                        </label>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, index) => (
                            <button
                              key={index}
                              type="button"
                              className={`w-8 h-8 ${
                                index < 3 ? "text-yellow-400" : "text-gray-300"
                              } hover:text-yellow-400 transition-colors`}
                            >
                              <svg
                                className="w-full h-full fill-current"
                                viewBox="0 0 15 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                                  fill=""
                                />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="review"
                          className="block text-sm font-semibold text-gray-900 mb-2"
                        >
                          Your Review*
                        </label>
                        <textarea
                          name="review"
                          id="review"
                          rows={5}
                          placeholder="Write your review here..."
                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue/20"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="name"
                            className="block text-sm font-semibold text-gray-900 mb-2"
                          >
                            Name*
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            placeholder="Your name"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue/20"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-semibold text-gray-900 mb-2"
                          >
                            Email*
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            placeholder="Your email"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue/20"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue to-blue-dark hover:from-blue-dark hover:to-blue-light text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Submit Review
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* <!-- tab content three end --> */}
          {/* <!--== tab content end ==--> */}
        </section>
      </PageContainer>

      <RecentlyViewedItems />

      <Newsletter />
    </>
  );
};

export default ShopDetails;
