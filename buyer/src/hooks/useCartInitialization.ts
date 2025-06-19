import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { fetchCart, resetCartState, selectCartInitialized, selectCartLoading } from '@/redux/features/cart-slice';
import { selectIsAuthenticated } from '@/redux/features/auth-slice';

/**
 * Hook to initialize cart data when user is authenticated
 * This should be used at the app level to ensure cart is loaded when user logs in
 */
export const useCartInitialization = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const cartInitialized = useAppSelector(selectCartInitialized);
  const cartLoading = useAppSelector(selectCartLoading);

  useEffect(() => {
    if (isAuthenticated && !cartInitialized && !cartLoading) {
      // User is authenticated but cart is not initialized, fetch it
      dispatch(fetchCart());
    } else if (!isAuthenticated && cartInitialized) {
      // User logged out, reset cart state
      dispatch(resetCartState());
    }
  }, [isAuthenticated, cartInitialized, cartLoading, dispatch]);

  return {
    isInitialized: cartInitialized,
    isLoading: cartLoading,
  };
};