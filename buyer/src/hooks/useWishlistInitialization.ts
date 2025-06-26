import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { fetchWishlistAsync, setWishlistItems, selectWishlistLoading } from '@/redux/features/wishlist-slice';
import { selectIsAuthenticated } from '@/redux/features/auth-slice';

/**
 * Hook to initialize wishlist data when user is authenticated
 * This should be used at the app level to ensure wishlist is loaded when user logs in
 */
export const useWishlistInitialization = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const wishlistLoading = useAppSelector(selectWishlistLoading);
  const [wishlistInitialized, setWishlistInitialized] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !wishlistInitialized && !wishlistLoading) {
      // User is authenticated but wishlist is not initialized, fetch it
      dispatch(fetchWishlistAsync())
        .then(() => {
          setWishlistInitialized(true);
        })
        .catch((error) => {
          console.error('Failed to initialize wishlist:', error);
          // Set as initialized even on error to prevent infinite retries
          setWishlistInitialized(true);
        });
    } else if (!isAuthenticated && wishlistInitialized) {
      // User logged out, reset wishlist state
      dispatch(setWishlistItems([]));
      setWishlistInitialized(false);
    }
  }, [isAuthenticated, wishlistInitialized, wishlistLoading, dispatch]);

  return {
    isInitialized: wishlistInitialized,
    isLoading: wishlistLoading,
  };
};