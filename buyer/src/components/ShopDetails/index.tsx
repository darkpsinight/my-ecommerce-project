"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Newsletter from "../Common/Newsletter";
import RecentlyViewedItems from "./RecentlyViewed";
import QuantityControl from "../Cart/QuantityControl";
import ReviewModal from "./ReviewModal";

import { useAppSelector } from "@/redux/store";
import { getProductById } from "@/services/product";
import {
  reviewService,
  type ListingReviewsResponse,
  type Review,
} from "@/services/reviews";
import { Product } from "@/types/product";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addItemToCartAsync,
  selectCartAddingItem,
  selectCartItems,
  selectIsItemBeingAdded,
} from "@/redux/features/cart-slice";
import {
  addItemToWishlistAsync,
  removeItemFromWishlistAsync,
  selectIsItemInWishlist,
  selectWishlistLoading,
} from "@/redux/features/wishlist-slice";
import { selectIsAuthenticated } from "@/redux/features/auth-slice";
import {
  updateproductDetails,
  clearProductDetails,
} from "@/redux/features/product-details";
import { addRecentlyViewedProduct } from "@/redux/features/recently-viewed-slice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import PageContainer from "../Common/PageContainer";
import ProductDetailSkeleton from "../Common/ProductDetailSkeleton";
import toast from "react-hot-toast";
import { useProductViewTracker } from "@/hooks/useViewedProducts";

const ShopDetails = () => {
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("tabOne");
  const [productData, setProductData] = useState<Product | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [showReviewsInfo, setShowReviewsInfo] = useState(false);
  const [reviewsData, setReviewsData] = useState<ListingReviewsResponse | null>(
    null
  );
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Track product view with our new hybrid storage system
  const { isTracking } = useProductViewTracker({
    productId: productId || "",
    metadata: {
      source: "direct",
      referrer: typeof window !== "undefined" ? document.referrer : undefined,
    },
    trackOnMount: false, // We'll track manually after product is loaded
    minViewDuration: 3000, // Track after 3 seconds
  });

  const tabs = [
    {
      id: "tabOne",
      title: "Description",
    },
    {
      id: "tabTwo",
      title: "Additional Information",
    },
  ];

  // Get product from Redux store
  const productFromStorage = useAppSelector(
    (state) => state.productDetailsReducer.value
  );

  // Get cart loading state
  const isAddingToCart = useAppSelector(selectCartAddingItem);
  const cartItems = useAppSelector(selectCartItems);
  const isWishlistLoading = useAppSelector(selectWishlistLoading);

  // Initialize fallback product
  const [fallbackProduct, setFallbackProduct] = useState<Product | null>(null);

  // Initialize fallback product from localStorage or Redux store only once on mount
  useEffect(() => {
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
    }
  }, []); // Only run on mount

  // Reset fallback product when productId changes
  useEffect(() => {
    if (productId) {
      // If we have a productId, clear fallback to prevent conflicts
      setFallbackProduct(null);
    }
  }, [productId]);

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

          // Only bypass cache on first load, not on re-renders
          const shouldBypassCache = false;

          // Fetch product data
          const data = await getProductById(productId, shouldBypassCache);

          // Only update state if component is still mounted
          if (!isMounted) return;

          if (data) {
            console.log("Product data fetched successfully:", data.title);
            setProductData(data);

            // Save to localStorage for persistence
            localStorage.setItem("productDetails", JSON.stringify(data));

            // Update Redux store with fresh data
            dispatch(updateproductDetails({ ...data }));

            // Add to recently viewed products (Redux - legacy)
            dispatch(addRecentlyViewedProduct({ ...data }));

            // Add to our new hybrid viewed products system
            // Import dynamically to avoid issues during SSR
            const { addViewedProduct } = await import(
              "@/services/viewedProducts"
            );
            await addViewedProduct(data.id, {
              source: "direct",
              referrer:
                typeof window !== "undefined" ? document.referrer : undefined,
            });
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
  }, [productId, dispatch]); // Removed productFromStorage.id and fallbackProduct to prevent circular updates

  // Handle fallback product when no productId is provided
  useEffect(() => {
    if (!productId && !productData) {
      console.log("No product ID and no product data, using fallback");
      setProductData(fallbackProduct);
    }
  }, [productId, productData, fallbackProduct]);

  // Use the fetched product data or fallback
  const product = productData || fallbackProduct;

  // Get per-item loading state (must be after product is defined)
  const isItemBeingAdded = useAppSelector((state) =>
    product ? selectIsItemBeingAdded(state, product.id) : false
  );

  // Get wishlist state (must be after product is defined)
  const isInWishlist = useAppSelector((state) =>
    product ? selectIsItemInWishlist(state, product.id) : false
  );

  // Stock validation logic
  const availableStock = product?.quantityOfActiveCodes || 0;
  const cartItem = product
    ? cartItems.find((cartItem) => cartItem.listingId === product.id)
    : null;
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

  // Fetch reviews when product data is available
  const fetchReviews = async (listingId: string, page: number = 1) => {
    try {
      setReviewsLoading(true);
      const reviews = await reviewService.getListingReviews(listingId, {
        page,
        limit: 5,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setReviewsData(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      // Set empty reviews data on error
      setReviewsData({
        reviews: [],
        pagination: { page: 1, limit: 5, total: 0, pages: 0 },
        statistics: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      });
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch reviews when product is loaded or page changes
  useEffect(() => {
    if (product?.id) {
      fetchReviews(product.id, currentReviewPage);
    }
  }, [product?.id, currentReviewPage]);

  // Reset page to 1 when product changes
  useEffect(() => {
    if (product?.id) {
      setCurrentReviewPage(1);
    }
  }, [product?.id]);

  // Add to cart handler
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
        quantity: quantity,
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
  };

  // Add to wishlist handler
  const handleAddToWishlist = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error("Please login to manage your wishlist");
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
      return;
    }

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

  // Handle review button click
  const handleLeaveReview = () => {
    if (!isAuthenticated) {
      toast.error("Please login to leave a review");
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
      return;
    }

    setIsReviewModalOpen(true);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (reviewsData && currentReviewPage < reviewsData.pagination.pages) {
      setCurrentReviewPage(currentReviewPage + 1);
      // Scroll to reviews section
      setTimeout(() => {
        const reviewsSection = document.getElementById("customer-reviews");
        if (reviewsSection) {
          reviewsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const handlePrevPage = () => {
    if (currentReviewPage > 1) {
      setCurrentReviewPage(currentReviewPage - 1);
      // Scroll to reviews section
      setTimeout(() => {
        const reviewsSection = document.getElementById("customer-reviews");
        if (reviewsSection) {
          reviewsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentReviewPage(page);
    // Scroll to reviews section
    setTimeout(() => {
      const reviewsSection = document.getElementById("customer-reviews");
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
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
            onClick={() => router.push("/products")}
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
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product?.title || "Digital Product",
            description: product?.description || "High-quality digital product",
            image:
              product?.imgs?.previews?.[0] ||
              product?.thumbnailUrl ||
              "/images/products/placeholder.png",
            sku: product?.id?.toString() || "unknown",
            category: product?.categoryName || "Digital Products",
            brand: {
              "@type": "Organization",
              name: "Digital Marketplace",
            },
            offers: {
              "@type": "Offer",
              price: product?.discountedPrice || product?.price || 0,
              priceCurrency: "USD",
              availability:
                product?.quantityOfActiveCodes > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              seller: {
                "@type": "Organization",
                name: product?.sellerMarketName || "Verified Seller",
              },
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.5",
              reviewCount: "12",
            },
          }),
        }}
      />

      <PageContainer>
        <section className="overflow-hidden pt-[50px] sm:pt-[90px] lg:pt-[80px] pb-1 sm:pb-2 bg-gradient-to-br via-white to-purple-50">
          {/* Page Title - Hidden but accessible for SEO */}
          <h1 className="sr-only">
            {product?.title} - Digital Product Details
          </h1>

          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <a
                  href="/"
                  className="text-body hover:text-blue transition-colors duration-200"
                >
                  Home
                </a>
              </li>
              <li aria-hidden="true" className="text-gray-4">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li>
                <a
                  href="/products"
                  className="text-body hover:text-blue transition-colors duration-200"
                >
                  Shop
                </a>
              </li>
              <li aria-hidden="true" className="text-gray-4">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              {product?.categoryName && (
                <>
                  <li>
                    <span className="text-body">{product.categoryName}</span>
                  </li>
                  <li aria-hidden="true" className="text-gray-4">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </li>
                </>
              )}
              <li
                aria-current="page"
                className="text-dark font-medium truncate max-w-[200px]"
              >
                {product?.title || "Product Details"}
              </li>
            </ol>
          </nav>

          <div className="flex flex-col xl:flex-row gap-8 xl:gap-12">
            {/* Product Image Section */}
            <div className="xl:max-w-[600px] w-full">
              <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden group">
                {/* Discount Badge */}
                {product.price && product.price > product.discountedPrice && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="inline-flex font-semibold text-sm text-white bg-gradient-to-r from-red to-red-dark rounded-full py-2 px-4 shadow-lg animate-pulse">
                      {calculateDiscountPercentage()}% OFF
                    </div>
                  </div>
                )}

                {/* Stock Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className="inline-flex items-center gap-1 font-medium text-sm text-green-700 bg-green-light-6 rounded-full py-2 px-3 shadow-lg">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    In Stock
                  </div>
                </div>

                {/* Product Image */}
                <div className="aspect-square lg:min-h-[500px] p-8 flex items-center justify-center bg-gradient-to-br from-blue-light-5 via-white to-purple-50">
                  <Image
                    src={
                      product.imgs?.previews?.[0] ||
                      product.thumbnailUrl ||
                      "/images/products/placeholder.png"
                    }
                    alt={product.title || "Product details"}
                    width={500}
                    height={500}
                    className="object-contain max-h-full w-full transition-all duration-500 group-hover:scale-105 drop-shadow-2xl"
                    priority
                  />
                </div>

                {/* Floating Trust Badges */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg py-2 px-3 shadow-lg">
                    <svg
                      className="w-4 h-4 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">
                      Verified
                    </span>
                  </div>

                  {product.autoDelivery && (
                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg py-2 px-3 shadow-lg">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">
                        Instant
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="flex-1 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
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
                    <span className="text-gray-500 text-sm">Sold by</span>
                    <button
                      onClick={() =>
                        router.push(`/marketplace/${product.sellerId}`)
                      }
                      className="text-blue font-semibold hover:text-blue-dark transition-colors duration-200 cursor-pointer underline decoration-1 underline-offset-2 hover:decoration-2"
                    >
                      {product.sellerMarketName ||
                        product.sellerName ||
                        "Unknown Seller"}
                    </button>
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
                <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, index) => (
                      <svg
                        key={index}
                        className="fill-yellow"
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
                  <span className="text-amber-700 text-sm font-medium">
                    5.0 ({product.reviews || 0} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-green-light-6 rounded-lg px-3 py-2">
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
                    {product.quantityOfActiveCodes || 0} In Stock
                  </span>
                </div>

                {product.autoDelivery && (
                  <div className="flex items-center gap-2 bg-blue-light-5 rounded-lg px-3 py-2">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span className="text-blue-600 font-medium text-sm">
                      Instant Delivery
                    </span>
                  </div>
                )}
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
                      {availableStock} active codes available
                      {quantityInCart > 0 && (
                        <span className="text-blue-600 font-medium">
                          {" "}
                          • {quantityInCart} in your cart
                        </span>
                      )}
                    </p>
                    {quantityInCart > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        You can add{" "}
                        {Math.max(0, availableStock - quantityInCart)} more
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${
                        availableStock > 5
                          ? "text-green-600"
                          : availableStock > 0
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {availableStock}
                    </div>
                    <div className="text-xs text-gray-500">
                      of {product.quantityOfAllCodes || 0} total
                    </div>
                    {quantityInCart > 0 && (
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        {quantityInCart} in cart
                      </div>
                    )}
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
                      onIncrease={() => {
                        const maxAddable = availableStock - quantityInCart;
                        setQuantity((prev) => Math.min(prev + 1, maxAddable));
                      }}
                      onDecrease={() =>
                        setQuantity((prev) => Math.max(prev - 1, 1))
                      }
                      min={1}
                      max={Math.max(1, availableStock - quantityInCart)}
                      disabled={
                        isOutOfStock ||
                        availableStock - quantityInCart <= 0 ||
                        (product.status &&
                          product.status.toLowerCase() === "inactive")
                      }
                      handleQuantityChange={(newQuantity) => {
                        const maxAddable = availableStock - quantityInCart;
                        setQuantity(
                          Math.min(Math.max(newQuantity, 1), maxAddable)
                        );
                      }}
                      showMaximumPulse={false}
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
                      isItemBeingAdded ||
                      isOutOfStock ||
                      wouldExceedStock ||
                      (product.status &&
                        product.status.toLowerCase() === "inactive")
                    }
                    className="flex-1 min-w-[200px] bg-gradient-to-r from-blue to-blue-dark hover:from-blue-dark hover:to-blue-light disabled:from-gray-300 disabled:to-gray-400 disabled:text-gray-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    title={
                      isOutOfStock
                        ? "Out of stock"
                        : wouldExceedStock
                        ? `Cannot add ${quantity} items. Maximum available: ${
                            availableStock - quantityInCart
                          }`
                        : isItemBeingAdded
                        ? "Adding to cart..."
                        : ""
                    }
                  >
                    {isItemBeingAdded && (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    {isItemBeingAdded
                      ? "Adding to Cart..."
                      : isOutOfStock
                      ? "Out of Stock"
                      : wouldExceedStock
                      ? "Quantity Exceeds Stock"
                      : product.status &&
                        product.status.toLowerCase() === "inactive"
                      ? "Inactive Product"
                      : quantityInCart > 0
                      ? `Add to Cart (${quantityInCart} in cart)`
                      : "Add to Cart"}
                  </button>

                  <button
                    onClick={handleAddToWishlist}
                    disabled={isWishlistLoading}
                    className={`flex items-center justify-center w-14 h-14 border-2 rounded-xl transition-all duration-200 group disabled:cursor-not-allowed disabled:opacity-70 ${
                      isInWishlist
                        ? "bg-red-50 border-red text-red hover:bg-red hover:text-white"
                        : "bg-white border-gray-200 hover:border-red-300 hover:bg-red-50"
                    }`}
                    aria-label={
                      isInWishlist ? "Remove from wishlist" : "Add to wishlist"
                    }
                  >
                    {isWishlistLoading ? (
                      // Loading spinner
                      <svg
                        className="animate-spin h-6 w-6 text-current"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className={`w-6 h-6 transition-colors ${
                          isInWishlist
                            ? "text-red group-hover:text-white"
                            : "text-gray-400 group-hover:text-red-500"
                        }`}
                        fill={isInWishlist ? "currentColor" : "none"}
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
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </PageContainer>

      {/* Customer Reviews Section */}
      <PageContainer>
        <section id="customer-reviews" className="-mt-16 lg:-mt-18">
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 text-center">
              Customer Reviews
            </h2>
            <p className="text-body text-center max-w-2xl mx-auto">
              See what verified customers are saying about this product.
            </p>
          </div>

          {/* Reviews Summary */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
              {reviewsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Overall Rating */}
                  <div className="text-center lg:text-left">
                    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4">
                      <div>
                        <div className="text-5xl font-bold text-gray-900 mb-2">
                          {reviewsData?.statistics.averageRating || 0}
                        </div>
                        <div className="flex items-center justify-center lg:justify-start gap-1 mb-2">
                          {[...Array(5)].map((_, index) => (
                            <svg
                              key={index}
                              className={`w-6 h-6 ${
                                index <
                                Math.floor(
                                  reviewsData?.statistics.averageRating || 0
                                )
                                  ? "fill-yellow"
                                  : "fill-gray-3"
                              }`}
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
                        <div className="text-gray-600 text-lg font-medium">
                          {reviewsData?.statistics.averageRating || 0} out of 5
                          stars
                        </div>
                        <div className="text-gray-500 text-sm mt-1">
                          {reviewsData?.statistics.totalReviews || 0} global
                          ratings
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count =
                        reviewsData?.statistics.ratingDistribution[
                          rating as keyof typeof reviewsData.statistics.ratingDistribution
                        ] || 0;
                      const total = reviewsData?.statistics.totalReviews || 0;
                      const percentage =
                        total > 0 ? Math.round((count / total) * 100) : 0;

                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm font-medium text-blue w-16">
                            <span>{rating} star</span>
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-4 relative overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-yellow to-yellow-dark h-full rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-sm font-medium text-blue w-10 text-right">
                            {percentage}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* How Reviews Work - Accordion */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowReviewsInfo(!showReviewsInfo)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                >
                  <h4 className="font-semibold text-gray-900 text-left">
                    How customer reviews and ratings work
                  </h4>
                  <div
                    className={`transform transition-transform duration-200 ${
                      showReviewsInfo ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      className="w-5 h-5 text-gray-600 group-hover:text-gray-800"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showReviewsInfo
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="p-4 bg-gray-50 rounded-b-lg">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Customer Reviews, including Product Star Ratings help
                      customers to learn more about the product and decide
                      whether it is the right product for them. To calculate the
                      overall star rating and percentage breakdown by star, we
                      don&apos;t use a simple average. Instead, our system
                      considers things like how recent a review is and if the
                      reviewer bought the item on our platform. It also analyzes
                      reviews to verify trustworthiness.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Reviews */}
          <div className="max-w-4xl mx-auto space-y-6">
            {reviewsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue"></div>
              </div>
            ) : reviewsData && reviewsData.reviews.length > 0 ? (
              reviewsData.reviews.map((review, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br ${
                        index % 5 === 0
                          ? "from-blue-light to-blue"
                          : index % 5 === 1
                          ? "from-purple-light to-purple"
                          : index % 5 === 2
                          ? "from-green-light to-green"
                          : index % 5 === 3
                          ? "from-red-light to-red"
                          : "from-green-light-2 to-green-light"
                      } flex items-center justify-center`}
                    >
                      <span className="text-white font-semibold text-lg">
                        {review.reviewerId?.name?.charAt(0)?.toUpperCase() ||
                          "U"}
                      </span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">
                            {review.reviewerId?.name || "Anonymous User"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, starIndex) => (
                                <svg
                                  key={starIndex}
                                  className={`w-4 h-4 ${
                                    starIndex < review.rating
                                      ? "fill-yellow"
                                      : "fill-gray-3"
                                  }`}
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
                            <span className="text-sm font-semibold text-gray-900">
                              {review.rating === 5
                                ? "Excellent!"
                                : review.rating === 4
                                ? "Great!"
                                : review.rating === 3
                                ? "Good"
                                : review.rating === 2
                                ? "Fair"
                                : "Poor"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm text-gray-500">
                              Reviewed on{" "}
                              {new Date(review.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-green-600 bg-green-light-6 px-3 py-1 rounded-full">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="font-medium">Verified Purchase</span>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-dark leading-relaxed mb-4">
                          {review.comment}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <button className="flex items-center gap-1 hover:text-blue transition-colors">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.60L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 712-2h2.5"
                            />
                          </svg>
                          Helpful ({review.helpfulVotes || 0})
                        </button>
                        <button className="hover:text-blue transition-colors">
                          Report
                        </button>
                      </div>

                      {/* Admin Response */}
                      {review.adminResponse && (
                        <div className="mt-4 p-4 bg-blue-light-5 rounded-lg border-l-4 border-blue">
                          <div className="flex items-start gap-3">
                            <div className="p-1 bg-blue rounded-full">
                              <svg
                                className="w-4 h-4 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-blue text-sm">
                                  Seller Response
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(
                                    review.adminResponseDate || ""
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                {review.adminResponse}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Reviews Yet
                </h3>
                <p className="text-gray-600">
                  Be the first to leave a review for this product!
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {reviewsData && reviewsData.pagination.pages > 1 && (
              <div className="flex justify-center items-center mt-8 gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentReviewPage === 1}
                  className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  aria-label="Previous page"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Page Numbers */}
                <div className="flex gap-1">
                  {Array.from({ length: reviewsData.pagination.pages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    const showPage = 
                      page === 1 || 
                      page === reviewsData.pagination.pages ||
                      Math.abs(page - currentReviewPage) <= 1;
                    
                    const showEllipsis = 
                      (page === 2 && currentReviewPage > 4) ||
                      (page === reviewsData.pagination.pages - 1 && currentReviewPage < reviewsData.pagination.pages - 3);

                    if (!showPage && !showEllipsis) return null;

                    if (showEllipsis) {
                      return (
                        <span key={`ellipsis-${page}`} className="flex items-center justify-center w-10 h-10 text-gray-500">
                          ...
                        </span>
                      );
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageClick(page)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-colors duration-200 ${
                          currentReviewPage === page
                            ? "bg-blue text-white border-blue shadow-md"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentReviewPage === reviewsData.pagination.pages}
                  className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  aria-label="Next page"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* Page Info */}
                <div className="ml-4 text-sm text-gray-600">
                  Page {currentReviewPage} of {reviewsData.pagination.pages}
                  <span className="ml-2 text-gray-400">
                    ({reviewsData.pagination.total} reviews)
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </PageContainer>

      <PageContainer>
        <section className=" pb-8">
          {/* <!--== tab header start ==--> */}
          <div className="flex items-center bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl shadow-lg gap-1 p-2 mb-8">
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
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-light-5 rounded-lg">
                    <svg
                      className="w-6 h-6 text-blue"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Product Description
                  </h3>
                </div>
                <div
                  className="prose prose-lg prose-gray max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html:
                      product.description ||
                      `<p class="text-gray-600">This digital product offers premium quality and instant delivery. Perfect for users looking for reliable digital codes with guaranteed functionality.</p>
                      <h4 class="text-lg font-semibold text-gray-900 mt-6 mb-3">Key Features:</h4>
                      <ul class="list-disc pl-6 space-y-2 text-gray-700">
                        <li>Instant digital delivery</li>
                        <li>100% working guarantee</li>
                        <li>24/7 customer support</li>
                        <li>Secure transaction processing</li>
                      </ul>`,
                  }}
                />
              </div>
            </div>
          </div>
          {/* <!-- tab content one end --> */}

          {/* <!-- tab content two start --> */}
          <div>
            <div className={`${activeTab === "tabTwo" ? "block" : "hidden"}`}>
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-light-6 rounded-lg">
                    <svg
                      className="w-6 h-6 text-green"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Product Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* <!-- info item --> */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-light-5 rounded-lg">
                        <svg
                          className="w-5 h-5 text-blue"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="text-sm font-semibold text-blue-dark">
                        Platform
                      </div>
                    </div>
                    <div className="text-base font-medium text-gray-900">
                      {product.platform || "Global"}
                    </div>
                  </div>

                  {/* <!-- info item --> */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg
                          className="w-5 h-5 text-purple"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-sm font-semibold text-purple-dark">
                        Region
                      </div>
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
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-teal-50 rounded-lg">
                            <svg
                              className="w-5 h-5 text-teal"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                              />
                            </svg>
                          </div>
                          <div className="text-sm font-semibold text-teal-dark">
                            Languages
                          </div>
                        </div>
                        <div className="text-base font-medium text-gray-900">
                          {product.supportedLanguages.join(", ")}
                        </div>
                      </div>
                    )}

                  {/* <!-- info item --> */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-light-6 rounded-lg">
                        <svg
                          className="w-5 h-5 text-green"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <div className="text-sm font-semibold text-green-dark">
                        Delivery
                      </div>
                    </div>
                    <div className="text-base font-medium text-gray-900">
                      {product.autoDelivery
                        ? "Instant Delivery"
                        : "Manual Delivery"}
                    </div>
                  </div>

                  {/* <!-- info item --> */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <svg
                          className="w-5 h-5 text-amber-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="text-sm font-semibold text-amber-700">
                        Seller
                      </div>
                    </div>
                    <div className="text-base font-medium text-gray-900 flex items-center gap-2">
                      {product.sellerMarketName ||
                        product.sellerName ||
                        "Verified Seller"}
                      {product.isSellerVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-light-6 rounded-full">
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
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-red-light-6 rounded-lg">
                        <svg
                          className="w-5 h-5 text-red"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </div>
                      <div className="text-sm font-semibold text-red-dark">
                        Stock
                      </div>
                    </div>
                    <div className="text-base font-medium text-gray-900">
                      {product.quantityOfActiveCodes || 0} available
                    </div>
                  </div>

                  {/* <!-- info item --> */}
                  {product.categoryName && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-light-5 rounded-lg">
                          <svg
                            className="w-5 h-5 text-blue"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                        </div>
                        <div className="text-sm font-semibold text-blue-dark">
                          Category
                        </div>
                      </div>
                      <div className="text-base font-medium text-gray-900">
                        {product.categoryName}
                      </div>
                    </div>
                  )}

                  {/* <!-- info item --> */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow duration-200 md:col-span-2 lg:col-span-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <svg
                            className="w-5 h-5 text-purple"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                        </div>
                        <div className="text-sm font-semibold text-purple-dark">
                          Tags
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium border border-gray-200 transition-colors duration-200"
                          >
                            #{tag}
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
          {/* <!--== tab content end ==--> */}
        </section>
      </PageContainer>

      <RecentlyViewedItems />

      <Newsletter />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productTitle={product?.title || "Product"}
      />
    </>
  );
};

export default ShopDetails;
