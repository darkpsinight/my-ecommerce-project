// Re-export types from services for consistency
import type { Order } from "@/services/orders";
export type { Order } from "@/services/orders";

// Additional types specific to the Orders page
export interface OrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export type OrderStatus = 'completed' | 'pending' | 'cancelled' | 'failed';

export interface OrderHeaderProps {
  title: string;
  subtitle: string;
  icon: "orders" | "loading" | "error" | "empty";
  isLoading?: boolean;
}