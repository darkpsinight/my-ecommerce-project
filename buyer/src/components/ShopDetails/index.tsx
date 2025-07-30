"use client";
import React, { useState, useEffect } from "react";
import Newsletter from "../Common/Newsletter";
import RecentlyViewedItems from "./RecentlyViewed";
import ReviewModal from "./ReviewModal";
import PageContainer from "../Common/PageContainer";
import ProductDetailSkeleton from "../Common/ProductDetailSkeleton";

// Components
import Breadcrumb from "./components/Breadcrumb";
import ProductImage from "./components/ProductImage";
import ProductHeader from "./components/ProductHeader";
import ProductActions from "./components/ProductActions";
import ProductRating from "./components/ProductRating";
import ProductTabs from "./components/ProductTabs";
import ProductReviews from "./components/ProductReviews";

// Utils
import { generateProductStructuredData } from "./utils/structuredData";

// Hooks
import { useProductData } from "./hooks/useProductData";
import { useProductTracking } from "./hooks/useProductTracking";
import { useProductReviews } from "./hooks/useProductReviews";
import { useProductActions } from "./hooks/useProductActions";
import { useExpirationGroups } from "./hooks/useExpirationGroups";
import { useProductAnalytics } from "./hooks/useProductAnalytics";
import { useProductPerformance } from "./hooks/useProductPerformance";

// Redux
import { useAppSelector } from "@/redux/store";
import { selectCartItems } from "@/redux/features/cart-slice";

const ShopDetails = () => {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("tabOne");
  const [showReviewsInfo, setShowReviewsInfo] = useState(false);

  // Get product from Redux store
  const productFromStorage = useAppSelector(
    (state) => state.productDetailsReducer.value
  );

  // Get cart items
  const cartItems = useAppSelector(selectCartItems);

  // Custom hooks
  const { product, productId, loading, router } = useProductData({
    productFromStorage,
  });

  const {
    expirationGroups,
    selectedExpirationGroups,
    setSelectedExpirationGroups,
    expirationGroupsLoading,
    useExpirationGroups: shouldUseExpirationGroups,
  } = useExpirationGroups(product?.id || null);

  const {
    reviewsData,
    reviewsLoading,
    currentReviewPage,
    handleNextPage,
    handlePrevPage,
    handlePageClick,
  } = useProductReviews(product?.id || null);

  // Stock validation logic
  const availableStock = product?.quantityOfActiveCodes || 0;
  const cartItem = product
    ? cartItems.find((cartItem) => cartItem.listingId === product.id)
    : null;
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const maxAddableQuantity = Math.max(1, availableStock - quantityInCart);

  const {
    isReviewModalOpen,
    setIsReviewModalOpen,
    isItemBeingAdded,
    isInWishlist,
    isWishlistLoading,
    isOutOfStock,
    wouldExceedStock,
    handleAddToCart,
    handleAddToWishlist,
    handleLeaveReview,
    canLeaveReview,
    reviewEligibilityLoading,
    hasExistingReview,
    reviewEligibilityReason,
  } = useProductActions({
    product,
    quantity,
    selectedExpirationGroups,
    useExpirationGroups: shouldUseExpirationGroups,
    availableStock,
    quantityInCart,
  });

  // Product tracking (view and duration)
  useProductTracking({
    product,
    productId,
    enabled: true,
  });

  // Mark impression as clicked when product detail page loads
  useEffect(() => {
    if (product?.id) {
      // Import the impression tracking utility
      import('@/utils/impressionTracking').then(({ markImpressionClicked }) => {
        markImpressionClicked(product.id).catch(error => {
          console.log('Note: No recent impression found to mark as clicked (this is normal if user came directly to product)');
        });
      });
    }
  }, [product?.id]);

  // Analytics tracking
  const { trackEvent, trackInteraction } = useProductAnalytics({
    product,
    enabled: true,
  });

  // Performance monitoring
  useProductPerformance({
    product,
    enabled: true,
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

  // Reset quantity if it exceeds the available stock considering cart items
  useEffect(() => {
    if (quantity > maxAddableQuantity) {
      setQuantity(Math.max(1, maxAddableQuantity));
    }
  }, [quantity, maxAddableQuantity]);

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
          __html: JSON.stringify(generateProductStructuredData(product)),
        }}
      />

      <PageContainer>
        <section className="overflow-hidden pt-[50px] sm:pt-[90px] lg:pt-[80px] pb-1 sm:pb-2 bg-gradient-to-br via-white to-purple-50">
          {/* Page Title - Hidden but accessible for SEO */}
          <h1 className="sr-only">
            {product?.title} - Digital Product Details
          </h1>

          {/* Breadcrumb Navigation */}
          <Breadcrumb product={product} />

          <div className="flex flex-col xl:flex-row gap-8 xl:gap-12">
            {/* Product Image Section */}
            <ProductImage product={product} />

            {/* Product Details Section */}
            <div className="flex-1 bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 p-6 lg:p-8">
              {/* Product Header */}
              <ProductHeader product={product} />

              {/* Rating & Reviews */}
              <ProductRating
                reviewsData={reviewsData}
                showReviewsInfo={showReviewsInfo}
                setShowReviewsInfo={setShowReviewsInfo}
              />

              {/* Product Actions */}
              <ProductActions
                product={product}
                quantity={quantity}
                setQuantity={setQuantity}
                maxAddableQuantity={maxAddableQuantity}
                isOutOfStock={isOutOfStock}
                isItemBeingAdded={isItemBeingAdded}
                isInWishlist={isInWishlist}
                isWishlistLoading={isWishlistLoading}
                handleAddToCart={handleAddToCart}
                handleAddToWishlist={handleAddToWishlist}
                expirationGroups={expirationGroups}
                selectedExpirationGroups={selectedExpirationGroups}
                setSelectedExpirationGroups={setSelectedExpirationGroups}
                expirationGroupsLoading={expirationGroupsLoading}
                useExpirationGroups={shouldUseExpirationGroups}
              />
            </div>
          </div>

          {/* Product Information Tabs */}
          <ProductTabs
            product={product}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            tabs={tabs}
          />

          {/* Customer Reviews Section */}
          <ProductReviews
            reviewsData={reviewsData}
            reviewsLoading={reviewsLoading}
            currentReviewPage={currentReviewPage}
            handleNextPage={handleNextPage}
            handlePrevPage={handlePrevPage}
            handlePageClick={handlePageClick}
            canLeaveReview={canLeaveReview}
            reviewEligibilityLoading={reviewEligibilityLoading}
            hasExistingReview={hasExistingReview}
            onLeaveReview={handleLeaveReview}
          />
        </section>

        {/* Recently Viewed Items */}
        <RecentlyViewedItems />

        {/* Newsletter */}
        <Newsletter />
      </PageContainer>

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        productTitle={product?.title || ""}
      />
    </>
  );
};

export default ShopDetails;
