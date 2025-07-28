import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/redux/store';
import { AppDispatch } from '@/redux/store';
import { Product } from '@/types/product';
import { addItemToCartAsync, selectIsItemBeingAdded } from '@/redux/features/cart-slice';
import { 
  addItemToWishlistAsync, 
  removeItemFromWishlistAsync, 
  selectIsItemInWishlist, 
  selectWishlistLoading 
} from '@/redux/features/wishlist-slice';
import { selectIsAuthenticated } from '@/redux/features/auth-slice';
import { useReviewEligibility } from './useReviewEligibility';
import toast from 'react-hot-toast';

interface UseProductActionsOptions {
  product: Product | null;
  quantity: number;
  selectedExpirationGroups: Array<{ type: "never_expires" | "expires"; count: number; date?: string }>;
  useExpirationGroups: boolean;
  availableStock: number;
  quantityInCart: number;
}

export const useProductActions = ({
  product,
  quantity,
  selectedExpirationGroups,
  useExpirationGroups,
  availableStock,
  quantityInCart
}: UseProductActionsOptions) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Get loading states
  const isItemBeingAdded = useAppSelector((state) =>
    product ? selectIsItemBeingAdded(state, product.id) : false
  );
  const isInWishlist = useAppSelector((state) =>
    product ? selectIsItemInWishlist(state, product.id) : false
  );
  const isWishlistLoading = useAppSelector(selectWishlistLoading);

  // Review eligibility check
  const reviewEligibility = useReviewEligibility({
    productId: product?.id || null,
    enabled: isAuthenticated
  });

  // Stock validation
  const isOutOfStock = availableStock === 0;
  const wouldExceedStock = quantityInCart + quantity > availableStock;

  // Add to cart handler
  const handleAddToCart = () => {
    if (!product) {
      toast.error("Product not found");
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please login to add items to your cart");
      setTimeout(() => {
        const currentUrl = window.location.pathname + window.location.search;
        const encodedRedirect = encodeURIComponent(currentUrl);
        router.push(`/signin?redirect=${encodedRedirect}`);
      }, 2000);
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

    // Determine the effective quantity and expiration groups
    let effectiveQuantity = quantity;
    let expirationGroupsToAdd = undefined;
    
    if (useExpirationGroups && selectedExpirationGroups.length > 0) {
      effectiveQuantity = selectedExpirationGroups.reduce((sum, group) => sum + group.count, 0);
      expirationGroupsToAdd = selectedExpirationGroups.map(group => ({
        type: group.type,
        count: group.count,
        date: group.date
      }));
      
      if (effectiveQuantity === 0) {
        toast.error("Please select at least one item from the expiration groups");
        return;
      }
    } else {
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
    }

    if (isItemBeingAdded) {
      toast.error("This item is already being added to cart");
      return;
    }

    const cartItem = {
      listingId: product.id,
      title: product.title,
      price: product.price,
      discountedPrice: product.discountedPrice,
      quantity: effectiveQuantity,
      imgs: product.imgs,
      sellerId: product.sellerId,
      availableStock: availableStock,
      listingSnapshot: {
        category: product.categoryName,
        platform: product.platform,
        region: product.region,
      },
      ...(expirationGroupsToAdd && { expirationGroups: expirationGroupsToAdd })
    };

    dispatch(addItemToCartAsync(cartItem));
  };

  // Add to wishlist handler
  const handleAddToWishlist = async () => {
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

    if (!reviewEligibility.canReview) {
      if (reviewEligibility.hasExistingReview) {
        toast.error("You have already reviewed this product");
      } else {
        toast.error(reviewEligibility.reason || "You must purchase this product before leaving a review");
      }
      return;
    }

    setIsReviewModalOpen(true);
  };

  return {
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
    // Review eligibility
    canLeaveReview: reviewEligibility.canReview,
    reviewEligibilityLoading: reviewEligibility.isLoading,
    hasExistingReview: reviewEligibility.hasExistingReview,
    reviewEligibilityReason: reviewEligibility.reason
  };
};