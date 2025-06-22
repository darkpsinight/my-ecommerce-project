"use client";
import { useState, useEffect, useCallback } from "react";
import { useAppSelector } from "@/redux/store";
import { ordersApi, Order } from "@/services/orders";
import { ORDERS_PER_PAGE } from "../constants";

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  setCurrentPage: (page: number) => void;
  refetch: () => void;
}

export const useOrders = (): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  
  const token = useAppSelector((state) => state.authReducer.token);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getBuyerOrders({
        page: currentPage,
        limit: ORDERS_PER_PAGE
      });

      if (response.success) {
        setOrders(response.data.orders);
        setTotalPages(response.data.pagination.pages);
        setTotalOrders(response.data.pagination.total);
        setError(null);
      } else {
        setError("Failed to fetch orders");
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.error || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token, currentPage, fetchOrders]);

  const refetch = useCallback(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    loading,
    error,
    currentPage,
    totalPages,
    totalOrders,
    setCurrentPage,
    refetch,
  };
};