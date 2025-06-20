import { Order } from "@/services/orders";

/**
 * Get the appropriate color class for order status
 * @param status - Order status
 * @returns Tailwind CSS classes for status styling
 */
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green text-white';
    case 'pending':
      return 'bg-yellow text-white';
    case 'processing':
      return 'bg-blue text-white';
    case 'cancelled':
    case 'failed':
      return 'bg-red text-white';
    default:
      return 'bg-gray-5 text-white';
  }
};

/**
 * Get the appropriate dot color for order status
 * @param status - Order status
 * @returns Tailwind CSS classes for status dot
 */
export const getStatusDotColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-light-4';
    case 'pending':
      return 'bg-yellow-light-2';
    case 'processing':
      return 'bg-blue-light-4';
    case 'cancelled':
    case 'failed':
      return 'bg-red-light-4';
    default:
      return 'bg-gray-4';
  }
};

/**
 * Get formatted order ID for display
 * @param externalId - Order external ID
 * @returns Formatted order ID
 */
export const getFormattedOrderId = (externalId: string): string => {
  return `#${externalId.slice(-8).toUpperCase()}`;
};

/**
 * Get payment method display name
 * @param paymentMethod - Payment method from API
 * @returns Human-readable payment method name
 */
export const getPaymentMethodDisplayName = (paymentMethod: string): string => {
  switch (paymentMethod.toLowerCase()) {
    case 'stripe':
      return 'Credit Card';
    case 'wallet':
      return 'Wallet';
    case 'paypal':
      return 'PayPal';
    default:
      return paymentMethod;
  }
};

/**
 * Calculate total items count in an order
 * @param order - Order object
 * @returns Total number of items
 */
export const getTotalItemsCount = (order: Order): number => {
  return order.orderItems.reduce((total, item) => total + item.quantity, 0);
};

/**
 * Get the main product title for order display
 * @param order - Order object
 * @returns Main product title with item count if multiple
 */
export const getOrderMainTitle = (order: Order): string => {
  if (order.orderItems.length === 0) {
    return 'No items';
  }
  
  const firstItem = order.orderItems[0];
  const title = firstItem.listing?.title || firstItem.title || 'Digital Code';
  
  if (order.orderItems.length === 1) {
    return title;
  }
  
  return `${title} (+${order.orderItems.length - 1} more)`;
};

/**
 * Check if order can be cancelled
 * @param order - Order object
 * @returns Whether order can be cancelled
 */
export const canCancelOrder = (order: Order): boolean => {
  return ['pending', 'processing'].includes(order.status.toLowerCase());
};

/**
 * Check if order is in a final state
 * @param order - Order object
 * @returns Whether order is in a final state
 */
export const isOrderFinal = (order: Order): boolean => {
  return ['completed', 'cancelled', 'failed'].includes(order.status.toLowerCase());
};