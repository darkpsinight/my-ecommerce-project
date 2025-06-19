"use client";

import { useCartInitialization } from '@/hooks/useCartInitialization';

/**
 * Component to initialize cart when user is authenticated
 * This component doesn't render anything, it just handles cart initialization
 */
const CartInitializer = () => {
  useCartInitialization();
  return null;
};

export default CartInitializer;