import { useState, useEffect } from 'react';
import { reviewService, type ListingReviewsResponse } from '@/services/reviews';

export const useProductReviews = (productId: string | null) => {
  const [reviewsData, setReviewsData] = useState<ListingReviewsResponse | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [currentReviewPage, setCurrentReviewPage] = useState(1);

  // Fetch reviews
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
    if (productId) {
      fetchReviews(productId, currentReviewPage);
    }
  }, [productId, currentReviewPage]);

  // Reset page to 1 when product changes
  useEffect(() => {
    if (productId) {
      setCurrentReviewPage(1);
    }
  }, [productId]);

  // Pagination handlers
  const handleNextPage = () => {
    if (reviewsData && currentReviewPage < reviewsData.pagination.pages) {
      setCurrentReviewPage(currentReviewPage + 1);
      scrollToReviews();
    }
  };

  const handlePrevPage = () => {
    if (currentReviewPage > 1) {
      setCurrentReviewPage(currentReviewPage - 1);
      scrollToReviews();
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentReviewPage(page);
    scrollToReviews();
  };

  const scrollToReviews = () => {
    setTimeout(() => {
      const reviewsSection = document.getElementById("customer-reviews");
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  return {
    reviewsData,
    reviewsLoading,
    currentReviewPage,
    handleNextPage,
    handlePrevPage,
    handlePageClick,
    fetchReviews
  };
};