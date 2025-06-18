"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Newsletter from "../Common/Newsletter";
import RecentlyViewedItems from "./RecentlyViewed";

import { useAppSelector } from "@/redux/store";
import { getProductById } from "@/services/product";
import { Product } from "@/types/product";
import { useRouter, useSearchParams } from "next/navigation";
import { addItemToCart } from "@/redux/features/cart-slice";
import { addItemToWishlist } from "@/redux/features/wishlist-slice";
import { updateproductDetails, clearProductDetails } from "@/redux/features/product-details";
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
  const productId = searchParams.get('id');

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
    if (!productId && typeof window !== 'undefined') {
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
      if (typeof window !== 'undefined') {
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
  }, [productId, dispatch, productFromStorage.id]); // Include productFromStorage.id in dependencies

  // Use the fetched product data or fallback
  const product = productData || fallbackProduct;



  // Add to cart handler
  const handleAddToCart = () => {
    if (product) {
      dispatch(
        addItemToCart({
          ...product,
          quantity: quantity,
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
    if (product && product.price && product.discountedPrice && product.price > product.discountedPrice) {
      const discount = ((product.price - product.discountedPrice) / product.price) * 100;
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
          <h2 className="text-2xl font-semibold text-dark mb-4">Product Not Found</h2>
          <p className="text-dark-4 mb-6">The product you&apos;re looking for is not available.</p>
          <button
            onClick={() => router.push('/shop-with-sidebar')}
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
        <section className="overflow-hidden py-20 bg-gray-2">
          <div className="flex flex-col lg:flex-row gap-7.5 xl:gap-17.5">
            <div className="lg:max-w-[570px] w-full">
              <div className="lg:min-h-[512px] rounded-lg shadow-1 bg-white p-4 sm:p-7.5 relative flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center">
                  <Image
                    src={product.imgs?.previews?.[0] || product.thumbnailUrl || '/images/products/placeholder.png'}
                    alt={product.title || "Product details"}
                    width={450}
                    height={450}
                    className="object-contain max-h-[450px] transition-all duration-300 hover:scale-105"
                    priority
                  />
                </div>
              </div>


            </div>

            {/* <!-- product content --> */}
            <div className="max-w-[539px] w-full">
              <div className="flex flex-col mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-xl sm:text-2xl xl:text-custom-3 text-dark shop-details-title max-w-[400px]">
                    {product.title}
                  </h2>

                  {product.price && product.price > product.discountedPrice && (
                    <div className="inline-flex font-medium text-custom-sm text-white bg-blue rounded py-0.5 px-2.5">
                      {calculateDiscountPercentage()}% OFF
                    </div>
                  )}
                </div>

                {product.categoryName && (
                  <div className="text-dark-4 text-sm mb-2">
                    Category: <span className="text-blue">{product.categoryName}</span>
                  </div>
                )}

                {/* Seller information */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-dark-4 text-sm">
                    Seller:
                    <span className="text-dark font-medium ml-1">
                      {product.sellerName || "Michael"}
                    </span>
                    {(product.isSellerVerified) && (
                      <span className="inline-flex items-center ml-1.5">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-green"
                        >
                          <path
                            d="M12 2L4 5.4V11.8C4 16.4 7.4 20.5 12 21.5C16.6 20.5 20 16.4 20 11.8V5.4L12 2ZM10.5 16.5L6.5 12.5L7.9 11.1L10.5 13.7L16.1 8.1L17.5 9.5L10.5 16.5Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="ml-0.5 text-xs text-green">Verified Seller</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5.5 mb-4.5">
                <div className="flex items-center gap-2.5">
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
                  </div>

                  <span> (5 customer reviews) </span>
                </div>

                <div className="flex items-center gap-1.5">
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
                        fill="#22AD5C"
                      />
                      <path
                        d="M12.6875 7.09374L8.9688 10.7187L7.2813 9.06249C7.00005 8.78124 6.56255 8.81249 6.2813 9.06249C6.00005 9.34374 6.0313 9.78124 6.2813 10.0625L8.2813 12C8.4688 12.1875 8.7188 12.2812 8.9688 12.2812C9.2188 12.2812 9.4688 12.1875 9.6563 12L13.6875 8.12499C13.9688 7.84374 13.9688 7.40624 13.6875 7.12499C13.4063 6.84374 12.9688 6.84374 12.6875 7.09374Z"
                        fill="#22AD5C"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_375_9221">
                        <rect width="20" height="20" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>

                  <span className="text-green"> In Stock </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4.5">
                <h3 className="font-medium text-2xl text-dark">
                  ${product.discountedPrice.toFixed(2)}
                </h3>
                {product.price && product.price > product.discountedPrice && (
                  <span className="line-through text-dark-4 text-lg">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>

              <ul className="flex flex-col gap-2">
                {product.autoDelivery && (
                  <li className="flex items-center gap-2.5">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3589 8.35863C13.603 8.11455 13.603 7.71882 13.3589 7.47475C13.1149 7.23067 12.7191 7.23067 12.4751 7.47475L8.75033 11.1995L7.5256 9.97474C7.28152 9.73067 6.8858 9.73067 6.64172 9.97474C6.39764 10.2188 6.39764 10.6146 6.64172 10.8586L8.30838 12.5253C8.55246 12.7694 8.94819 12.7694 9.19227 12.5253L13.3589 8.35863Z"
                        fill="#3C50E0"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.0003 1.04169C5.05277 1.04169 1.04199 5.05247 1.04199 10C1.04199 14.9476 5.05277 18.9584 10.0003 18.9584C14.9479 18.9584 18.9587 14.9476 18.9587 10C18.9587 5.05247 14.9479 1.04169 10.0003 1.04169ZM2.29199 10C2.29199 5.74283 5.74313 2.29169 10.0003 2.29169C14.2575 2.29169 17.7087 5.74283 17.7087 10C17.7087 14.2572 14.2575 17.7084 10.0003 17.7084C5.74313 17.7084 2.29199 14.2572 2.29199 10Z"
                        fill="#3C50E0"
                      />
                    </svg>
                    Instant Auto Delivery
                  </li>
                )}

                <li className="flex items-center gap-2.5">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M13.3589 8.35863C13.603 8.11455 13.603 7.71882 13.3589 7.47475C13.1149 7.23067 12.7191 7.23067 12.4751 7.47475L8.75033 11.1995L7.5256 9.97474C7.28152 9.73067 6.8858 9.73067 6.64172 9.97474C6.39764 10.2188 6.39764 10.6146 6.64172 10.8586L8.30838 12.5253C8.55246 12.7694 8.94819 12.7694 9.19227 12.5253L13.3589 8.35863Z"
                      fill="#3C50E0"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10.0003 1.04169C5.05277 1.04169 1.04199 5.05247 1.04199 10C1.04199 14.9476 5.05277 18.9584 10.0003 18.9584C14.9479 18.9584 18.9587 14.9476 18.9587 10C18.9587 5.05247 14.9479 1.04169 10.0003 1.04169ZM2.29199 10C2.29199 5.74283 5.74313 2.29169 10.0003 2.29169C14.2575 2.29169 17.7087 5.74283 17.7087 10C17.7087 14.2572 14.2575 17.7084 10.0003 17.7084C5.74313 17.7084 2.29199 14.2572 2.29199 10Z"
                      fill="#3C50E0"
                    />
                  </svg>
                  Platform: {product.platform || 'Global'}
                </li>

                {product.isRegionLocked && (
                  <li className="flex items-center gap-2.5">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3589 8.35863C13.603 8.11455 13.603 7.71882 13.3589 7.47475C13.1149 7.23067 12.7191 7.23067 12.4751 7.47475L8.75033 11.1995L7.5256 9.97474C7.28152 9.73067 6.8858 9.73067 6.64172 9.97474C6.39764 10.2188 6.39764 10.6146 6.64172 10.8586L8.30838 12.5253C8.55246 12.7694 8.94819 12.7694 9.19227 12.5253L13.3589 8.35863Z"
                        fill="#3C50E0"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.0003 1.04169C5.05277 1.04169 1.04199 5.05247 1.04199 10C1.04199 14.9476 5.05277 18.9584 10.0003 18.9584C14.9479 18.9584 18.9587 14.9476 18.9587 10C18.9587 5.05247 14.9479 1.04169 10.0003 1.04169ZM2.29199 10C2.29199 5.74283 5.74313 2.29169 10.0003 2.29169C14.2575 2.29169 17.7087 5.74283 17.7087 10C17.7087 14.2572 14.2575 17.7084 10.0003 17.7084C5.74313 17.7084 2.29199 14.2572 2.29199 10Z"
                        fill="#3C50E0"
                      />
                    </svg>
                    Region: {product.region || 'Unknown'}
                  </li>
                )}

                {product.supportedLanguages && product.supportedLanguages.length > 0 && (
                  <li className="flex items-center gap-2.5">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3589 8.35863C13.603 8.11455 13.603 7.71882 13.3589 7.47475C13.1149 7.23067 12.7191 7.23067 12.4751 7.47475L8.75033 11.1995L7.5256 9.97474C7.28152 9.73067 6.8858 9.73067 6.64172 9.97474C6.39764 10.2188 6.39764 10.6146 6.64172 10.8586L8.30838 12.5253C8.55246 12.7694 8.94819 12.7694 9.19227 12.5253L13.3589 8.35863Z"
                        fill="#3C50E0"
                      />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M10.0003 1.04169C5.05277 1.04169 1.04199 5.05247 1.04199 10C1.04199 14.9476 5.05277 18.9584 10.0003 18.9584C14.9479 18.9584 18.9587 14.9476 18.9587 10C18.9587 5.05247 14.9479 1.04169 10.0003 1.04169ZM2.29199 10C2.29199 5.74283 5.74313 2.29169 10.0003 2.29169C14.2575 2.29169 17.7087 5.74283 17.7087 10C17.7087 14.2572 14.2575 17.7084 10.0003 17.7084C5.74313 17.7084 2.29199 14.2572 2.29199 10Z"
                        fill="#3C50E0"
                      />
                    </svg>
                    Languages: {product.supportedLanguages.join(', ')}
                  </li>
                )}
              </ul>

              <form onSubmit={(e) => e.preventDefault()}>
                <div className="flex flex-col gap-4.5 border-y border-gray-3 mt-7.5 mb-9 py-9">
                  {/* Tags display */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex items-center gap-4">
                      <div className="min-w-[65px]">
                        <h4 className="font-medium text-dark">Tags:</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {product.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2.5 py-1 rounded-md bg-gray-1 text-dark-4 text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4.5">
                  <div className="flex items-center rounded-md border border-gray-3">
                    <button
                      aria-label="button for remove product"
                      className="flex items-center justify-center w-12 h-12 ease-out duration-200 hover:text-blue"
                      onClick={() =>
                        quantity > 1 && setQuantity(quantity - 1)
                      }
                      disabled={!product.quantityOfActiveCodes || product.quantityOfActiveCodes === 0}
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
                          d="M3.33301 10.0001C3.33301 9.53984 3.7061 9.16675 4.16634 9.16675H15.833C16.2932 9.16675 16.6663 9.53984 16.6663 10.0001C16.6663 10.4603 16.2932 10.8334 15.833 10.8334H4.16634C3.7061 10.8334 3.33301 10.4603 3.33301 10.0001Z"
                          fill=""
                        />
                      </svg>
                    </button>

                    <span className="flex items-center justify-center w-16 h-12 border-x border-gray-4">
                      {quantity}
                    </span>

                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      aria-label="button for add product"
                      className="flex items-center justify-center w-12 h-12 ease-out duration-200 hover:text-blue"
                      disabled={!product.quantityOfActiveCodes || quantity >= product.quantityOfActiveCodes}
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
                          d="M3.33301 10C3.33301 9.5398 3.7061 9.16671 4.16634 9.16671H15.833C16.2932 9.16671 16.6663 9.5398 16.6663 10C16.6663 10.4603 16.2932 10.8334 15.833 10.8334H4.16634C3.7061 10.8334 3.33301 10.4603 3.33301 10Z"
                          fill=""
                        />
                        <path
                          d="M9.99967 16.6667C9.53944 16.6667 9.16634 16.2936 9.16634 15.8334L9.16634 4.16671C9.16634 3.70647 9.53944 3.33337 9.99967 3.33337C10.4599 3.33337 10.833 3.70647 10.833 4.16671L10.833 15.8334C10.833 16.2936 10.4599 16.6667 9.99967 16.6667Z"
                          fill=""
                        />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
                    disabled={!product.quantityOfActiveCodes || product.quantityOfActiveCodes === 0}
                  >
                    Add to Cart
                  </button>

                  <button
                    onClick={handleAddToWishlist}
                    className="flex items-center justify-center w-12 h-12 rounded-md border border-gray-3 ease-out duration-200 hover:text-white hover:bg-dark hover:border-transparent"
                    aria-label="Add to wishlist"
                  >
                    <svg
                      className="fill-current"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M5.62436 4.42423C3.96537 5.18256 2.75 6.98626 2.75 9.13713C2.75 11.3345 3.64922 13.0283 4.93829 14.4798C6.00072 15.6761 7.28684 16.6677 8.54113 17.6346C8.83904 17.8643 9.13515 18.0926 9.42605 18.3219C9.95208 18.7366 10.4213 19.1006 10.8736 19.3649C11.3261 19.6293 11.6904 19.75 12 19.75C12.3096 19.75 12.6739 19.6293 13.1264 19.3649C13.5787 19.1006 14.0479 18.7366 14.574 18.3219C14.8649 18.0926 15.161 17.8643 15.4589 17.6346C16.7132 16.6677 17.9993 15.6761 19.0617 14.4798C20.3508 13.0283 21.25 11.3345 21.25 9.13713C21.25 6.98626 20.0346 5.18256 18.3756 4.42423C16.7639 3.68751 14.5983 3.88261 12.5404 6.02077C12.399 6.16766 12.2039 6.25067 12 6.25067C11.7961 6.25067 11.601 6.16766 11.4596 6.02077C9.40166 3.88261 7.23607 3.68751 5.62436 4.42423ZM12 4.45885C9.68795 2.39027 7.09896 2.1009 5.00076 3.05999C2.78471 4.07296 1.25 6.42506 1.25 9.13713C1.25 11.8027 2.3605 13.8361 3.81672 15.4758C4.98287 16.789 6.41022 17.888 7.67083 18.8586C7.95659 19.0786 8.23378 19.2921 8.49742 19.4999C9.00965 19.9037 9.55954 20.3343 10.1168 20.66C10.6739 20.9855 11.3096 21.25 12 21.25C12.6904 21.25 13.3261 20.9855 13.8832 20.66C14.4405 20.3343 14.9903 19.9037 15.5026 19.4999C15.7662 19.2921 16.0434 19.0786 16.3292 18.8586C17.5898 17.888 19.0171 16.789 20.1833 15.4758C21.6395 13.8361 22.75 11.8027 22.75 9.13713C22.75 6.42506 21.2153 4.07296 18.9992 3.05999C16.901 2.1009 14.3121 2.39027 12 4.45885Z"
                        fill=""
                      />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </PageContainer>

      <PageContainer>
        <section className="overflow-hidden bg-gray-2 py-20">
          {/* <!--== tab header start ==--> */}
          <div className="flex flex-wrap items-center bg-white rounded-[10px] shadow-1 gap-5 xl:gap-12.5 py-4.5 px-4 sm:px-6 mb-10">
            {tabs.map((item, key) => (
              <button
                key={key}
                onClick={() => setActiveTab(item.id)}
                className={`font-medium lg:text-lg ease-out duration-200 hover:text-blue relative before:h-0.5 before:bg-blue before:absolute before:left-0 before:bottom-0 before:ease-out before:duration-200 hover:before:w-full ${
                  activeTab === item.id
                    ? "text-blue before:w-full"
                    : "text-dark before:w-0"
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
            <div
              className={`flex-col sm:flex-row gap-7.5 xl:gap-12.5 mt-12.5 ${
                activeTab === "tabOne" ? "flex" : "hidden"
              }`}
            >
              <div className="max-w-[1000px] w-full">
                <div className="bg-white rounded-xl shadow-1 p-6">
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: product.description || 'No description available for this product.' }} />
                </div>
              </div>
            </div>
          </div>
          {/* <!-- tab content one end --> */}

          {/* <!-- tab content two start --> */}
          <div>
            <div
              className={`rounded-xl bg-white shadow-1 p-4 sm:p-6 mt-10 ${
                activeTab === "tabTwo" ? "block" : "hidden"
              }`}
            >
              {/* <!-- info item --> */}
              <div className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5">
                <div className="max-w-[450px] min-w-[140px] w-full">
                  <p className="text-sm sm:text-base text-dark">Platform</p>
                </div>
                <div className="w-full">
                  <p className="text-sm sm:text-base text-dark">{product.platform || 'Global'}</p>
                </div>
              </div>

              {/* <!-- info item --> */}
              <div className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5">
                <div className="max-w-[450px] min-w-[140px] w-full">
                  <p className="text-sm sm:text-base text-dark">Region</p>
                </div>
                <div className="w-full">
                  <p className="text-sm sm:text-base text-dark">
                    {product.isRegionLocked ? product.region || 'Region Locked' : 'Global (No Region Lock)'}
                  </p>
                </div>
              </div>

              {/* <!-- info item --> */}
              {product.supportedLanguages && product.supportedLanguages.length > 0 && (
                <div className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5">
                  <div className="max-w-[450px] min-w-[140px] w-full">
                    <p className="text-sm sm:text-base text-dark">
                      Supported Languages
                    </p>
                  </div>
                  <div className="w-full">
                    <p className="text-sm sm:text-base text-dark">
                      {product.supportedLanguages.join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {/* <!-- info item --> */}
              <div className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5">
                <div className="max-w-[450px] min-w-[140px] w-full">
                  <p className="text-sm sm:text-base text-dark">
                    Auto Delivery
                  </p>
                </div>
                <div className="w-full">
                  <p className="text-sm sm:text-base text-dark">
                    {product.autoDelivery ? 'Yes - Instant Delivery' : 'No - Manual Delivery'}
                  </p>
                </div>
              </div>

              {/* <!-- info item --> */}
              <div className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5">
                <div className="max-w-[450px] min-w-[140px] w-full">
                  <p className="text-sm sm:text-base text-dark">
                    Seller
                  </p>
                </div>
                <div className="w-full">
                  <p className="text-sm sm:text-base text-dark flex items-center">
                    {product.sellerName || "Michael"}
                    {(product.isSellerVerified) && (
                      <span className="inline-flex items-center ml-2">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          className="text-green"
                        >
                          <path
                            d="M12 2L4 5.4V11.8C4 16.4 7.4 20.5 12 21.5C16.6 20.5 20 16.4 20 11.8V5.4L12 2ZM10.5 16.5L6.5 12.5L7.9 11.1L10.5 13.7L16.1 8.1L17.5 9.5L10.5 16.5Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span className="ml-0.5 text-xs text-green">Verified Seller</span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* <!-- info item --> */}
              <div className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5">
                <div className="max-w-[450px] min-w-[140px] w-full">
                  <p className="text-sm sm:text-base text-dark">
                    Available Codes
                  </p>
                </div>
                <div className="w-full">
                  <p className="text-sm sm:text-base text-dark">
                    {product.quantityOfActiveCodes || 0} active / {product.quantityOfAllCodes || 0} total
                  </p>
                </div>
              </div>

              {/* <!-- info item --> */}
              {product.categoryName && (
                <div className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5">
                  <div className="max-w-[450px] min-w-[140px] w-full">
                    <p className="text-sm sm:text-base text-dark">Category</p>
                  </div>
                  <div className="w-full">
                    <p className="text-sm sm:text-base text-dark">
                      {product.categoryName}
                    </p>
                  </div>
                </div>
              )}

              {/* <!-- info item --> */}
              {product.tags && product.tags.length > 0 && (
                <div className="rounded-md even:bg-gray-1 flex py-4 px-4 sm:px-5">
                  <div className="max-w-[450px] min-w-[140px] w-full">
                    <p className="text-sm sm:text-base text-dark">
                      Tags
                    </p>
                  </div>
                  <div className="w-full">
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2.5 py-1 rounded-md bg-gray-1 text-dark-4 text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* <!-- tab content two end --> */}

          {/* <!-- tab content three start --> */}
          <div>
            <div
              className={`flex-col sm:flex-row gap-7.5 xl:gap-12.5 mt-12.5 ${
                activeTab === "tabThree" ? "flex" : "hidden"
              }`}
            >
              <div className="max-w-[570px] w-full">
                <h2 className="font-medium text-2xl text-dark mb-9">
                  {product.reviews || 0} Reviews for this product
                </h2>

                <div className="flex flex-col gap-6">
                  {/* <!-- review item --> */}
                  <div className="rounded-xl bg-white shadow-1 p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <a href="#" className="flex items-center gap-4">
                        <div className="w-12.5 h-12.5 rounded-full overflow-hidden">
                          <Image
                            src="/images/users/user-01.jpg"
                            alt="author"
                            className="w-12.5 h-12.5 rounded-full overflow-hidden"
                            width={50}
                            height={50}
                          />
                        </div>

                        <div>
                          <h3 className="font-medium text-dark">
                            John Smith
                          </h3>
                          <p className="text-custom-sm">
                            Verified Buyer
                          </p>
                        </div>
                      </a>

                      <div className="flex items-center gap-1">
                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>
                      </div>
                    </div>

                    <p className="text-dark mt-6">
                      Great digital product! The code worked perfectly and was easy to redeem. The seller provided excellent support when I had questions about activation. Would definitely buy from this seller again.
                    </p>
                  </div>

                  {/* <!-- review item --> */}
                  <div className="rounded-xl bg-white shadow-1 p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <a href="#" className="flex items-center gap-4">
                        <div className="w-12.5 h-12.5 rounded-full overflow-hidden">
                          <Image
                            src="/images/users/user-01.jpg"
                            alt="author"
                            className="w-12.5 h-12.5 rounded-full overflow-hidden"
                            width={50}
                            height={50}
                          />
                        </div>

                        <div>
                          <h3 className="font-medium text-dark">
                            Sarah Johnson
                          </h3>
                          <p className="text-custom-sm">
                            Verified Buyer
                          </p>
                        </div>
                      </a>

                      <div className="flex items-center gap-1">
                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>
                      </div>
                    </div>

                    <p className="text-dark mt-6">
                      Fast delivery and the code worked without any issues. The product description was accurate and I got exactly what I expected. The platform-specific instructions were very helpful. Would recommend!
                    </p>
                  </div>

                  {/* <!-- review item --> */}
                  <div className="rounded-xl bg-white shadow-1 p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                      <a href="#" className="flex items-center gap-4">
                        <div className="w-12.5 h-12.5 rounded-full overflow-hidden">
                          <Image
                            src="/images/users/user-01.jpg"
                            alt="author"
                            className="w-12.5 h-12.5 rounded-full overflow-hidden"
                            width={50}
                            height={50}
                          />
                        </div>

                        <div>
                          <h3 className="font-medium text-dark">
                            Michael Chen
                          </h3>
                          <p className="text-custom-sm">
                            Verified Buyer
                          </p>
                        </div>
                      </a>

                      <div className="flex items-center gap-1">
                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>

                        <span className="cursor-pointer text-[#FBB040]">
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>
                      </div>
                    </div>

                    <p className="text-dark mt-6">
                      I was hesitant at first, but this turned out to be a great purchase. The code was delivered instantly after payment, and activation was straightforward. The seller even followed up to make sure everything was working properly. Five stars!
                    </p>
                  </div>
                </div>
              </div>

              <div className="max-w-[550px] w-full">
                <form className="bg-white rounded-xl shadow-1 p-6">
                  <h2 className="font-medium text-2xl text-dark mb-3.5">
                    Write a Review
                  </h2>

                  <p className="mb-6">
                    Share your experience with this digital product. Required
                    fields are marked *
                  </p>

                  <div className="flex items-center gap-3 mb-7.5">
                    <span>Your Rating*</span>

                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, index) => (
                        <span
                          key={index}
                          className={`cursor-pointer ${index < 3 ? 'text-[#FBB040]' : 'text-gray-5'}`}
                        >
                          <svg
                            className="fill-current"
                            width="15"
                            height="16"
                            viewBox="0 0 15 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M14.6604 5.90785L9.97461 5.18335L7.85178 0.732874C7.69645 0.422375 7.28224 0.422375 7.12691 0.732874L5.00407 5.20923L0.344191 5.90785C0.0076444 5.9596 -0.121797 6.39947 0.137085 6.63235L3.52844 10.1255L2.72591 15.0158C2.67413 15.3522 3.01068 15.6368 3.32134 15.4298L7.54112 13.1269L11.735 15.4298C12.0198 15.5851 12.3822 15.3263 12.3046 15.0158L11.502 10.1255L14.8934 6.63235C15.1005 6.39947 14.9969 5.9596 14.6604 5.90785Z"
                              fill=""
                            />
                          </svg>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white shadow-1 p-4 sm:p-6">
                    <div className="mb-5">
                      <label htmlFor="comments" className="block mb-2.5">
                        Comments
                      </label>

                      <textarea
                        name="comments"
                        id="comments"
                        rows={5}
                        placeholder="Your comments"
                        className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full p-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                      ></textarea>

                      <span className="flex items-center justify-between mt-2.5">
                        <span className="text-custom-sm text-dark-4">
                          Maximum
                        </span>
                        <span className="text-custom-sm text-dark-4">
                          0/250
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-5 sm:gap-7.5 mb-5.5">
                      <div>
                        <label htmlFor="name" className="block mb-2.5">
                          Name
                        </label>

                        <input
                          type="text"
                          name="name"
                          id="name"
                          placeholder="Your name"
                          className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block mb-2.5">
                          Email
                        </label>

                        <input
                          type="email"
                          name="email"
                          id="email"
                          placeholder="Your email"
                          className="rounded-md border border-gray-3 bg-gray-1 placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:border-transparent focus:shadow-input focus:ring-2 focus:ring-blue/20"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="inline-flex font-medium text-white bg-blue py-3 px-7 rounded-md ease-out duration-200 hover:bg-blue-dark"
                    >
                      Submit Reviews
                    </button>
                  </div>
                </form>
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
