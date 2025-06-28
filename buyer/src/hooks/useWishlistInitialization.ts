import { useEffect, useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { fetchWishlistAsync, setWishlistItems, selectWishlistLoading, selectWishlistItems } from '@/redux/features/wishlist-slice';
import { selectIsAuthenticated } from '@/redux/features/auth-slice';

/**
 * Hook to initialize wishlist data when user is authenticated
 * This should be used at the app level to ensure wishlist is loaded when user logs in
 */
export const useWishlistInitialization = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const wishlistLoading = useAppSelector(selectWishlistLoading);
  const wishlistItems = useAppSelector(selectWishlistItems);
  const [wishlistInitialized, setWishlistInitialized] = useState(false);
  const initializationAttempted = useRef(false);

  useEffect(() => {
    // If user is not authenticated, reset everything
    if (!isAuthenticated) {
      if (wishlistInitialized) {
        console.log('User logged out, resetting wishlist state');
        dispatch(setWishlistItems([]));
        setWishlistInitialized(false);
      }
      initializationAttempted.current = false;
      return;
    }

    // If user is authenticated and we haven't attempted initialization yet
    if (isAuthenticated && !initializationAttempted.current && !wishlistLoading) {
      // Check if wishlist already has items (from previous session or other source)
      if (wishlistItems.length > 0) {
        console.log('Wishlist already has items, marking as initialized');
        setWishlistInitialized(true);
        initializationAttempted.current = true;
        return;
      }

      // Fetch wishlist data
      console.log('Initializing wishlist for authenticated user');
      initializationAttempted.current = true;
      
      dispatch(fetchWishlistAsync())
        .then(() => {
          console.log('Wishlist initialized successfully');
          setWishlistInitialized(true);
        })
        .catch((error) => {
          console.error('Failed to initialize wishlist:', error);
          // Set as initialized even on error to prevent infinite retries
          setWishlistInitialized(true);
        });
    }
  }, [isAuthenticated, wishlistLoading, wishlistItems.length, wishlistInitialized, dispatch]);

  return {
    isInitialized: wishlistInitialized,
    isLoading: wishlistLoading,
  };
};