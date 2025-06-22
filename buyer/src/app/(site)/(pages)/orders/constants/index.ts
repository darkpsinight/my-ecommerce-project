// Orders page constants

export const ORDERS_PER_PAGE = 5;

export const ORDER_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  PROCESSING: 'processing',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

export const PAYMENT_METHODS = {
  STRIPE: 'stripe',
  WALLET: 'wallet',
  PAYPAL: 'paypal',
} as const;

export const ROUTES = {
  SHOP: '/shop-with-sidebar',
  ORDERS: '/orders',
} as const;

export const LOADING_SKELETON_COUNT = 3;

export const ORDER_ID_DISPLAY_LENGTH = 8;