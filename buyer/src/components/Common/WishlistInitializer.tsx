"use client";

import { useWishlistInitialization } from '@/hooks/useWishlistInitialization';

/**
 * Component to initialize wishlist when user is authenticated
 * This component doesn't render anything, it just handles wishlist initialization
 */
const WishlistInitializer = () => {
  useWishlistInitialization();
  return null;
};

export default WishlistInitializer;