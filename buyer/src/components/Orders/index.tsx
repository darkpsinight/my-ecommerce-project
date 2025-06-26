import React, { useEffect, useState } from "react";
import SingleOrder from "./SingleOrder";
import ordersData from "./ordersData";
import { ordersApi, type Order } from "@/services/orders";

// Define the interface for transformed order data to match component expectations
interface TransformedOrder {
  orderId: string;
  createdAt: string;
  status: string;
  total: string;
  title: string;
  currency: string;
  paymentMethod: string;
  deliveryStatus: string;
  originalOrder: Order;
}

const Orders = () => {
  const [orders, setOrders] = useState<TransformedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ordersApi.getBuyerOrders();
        
        if (response.success) {
          // Transform API data to match component expectations
          const transformedOrders = response.data.orders.map((order) => ({
            orderId: order.externalId,
            createdAt: new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            status: order.status,
            total: `$${order.totalAmount.toFixed(2)}`,
            title: order.orderItems.length > 1 
              ? `${order.orderItems[0].title} (+${order.orderItems.length - 1} more)`
              : order.orderItems[0]?.title || 'Digital Code',
            currency: order.currency,
            paymentMethod: order.paymentMethod,
            deliveryStatus: order.deliveryStatus,
            originalOrder: order // Keep reference to original data
          }));
          setOrders(transformedOrders);
        } else {
          setError(response.message || 'Failed to fetch orders');
        }
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[770px] py-9.5 px-4 sm:px-7.5 xl:px-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[770px] py-9.5 px-4 sm:px-7.5 xl:px-10 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 mb-2">Failed to load orders</p>
            <p className="text-sm text-gray-600">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <div className="min-w-[770px]">
          {/* <!-- order item --> */}
          {orders.length > 0 && (
            <div className="items-center justify-between py-4.5 px-7.5 hidden md:flex ">
              <div className="min-w-[111px]">
                <p className="text-custom-sm text-dark">Order</p>
              </div>
              <div className="min-w-[175px]">
                <p className="text-custom-sm text-dark">Date</p>
              </div>

              <div className="min-w-[128px]">
                <p className="text-custom-sm text-dark">Status</p>
              </div>

              <div className="min-w-[213px]">
                <p className="text-custom-sm text-dark">Title</p>
              </div>

              <div className="min-w-[113px]">
                <p className="text-custom-sm text-dark">Total</p>
              </div>

              <div className="min-w-[113px]">
                <p className="text-custom-sm text-dark">Action</p>
              </div>
            </div>
          )}
          {orders.length > 0 ? (
            orders.map((orderItem, key) => (
              <SingleOrder key={orderItem.orderId || key} orderItem={orderItem} smallView={false} />
            ))
          ) : (
            <div className="py-9.5 px-4 sm:px-7.5 xl:px-10 text-center">
              <div className="bg-gray-50 rounded-lg p-8">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-4">You haven&apos;t placed any orders yet. Start shopping to see your orders here.</p>
                <a 
                  href="/products" 
                  className="inline-flex items-center px-4 py-2 bg-blue text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Shopping
                </a>
              </div>
            </div>
          )}
        </div>

        {orders.length > 0 &&
          orders.map((orderItem, key) => (
            <SingleOrder key={orderItem.orderId || key} orderItem={orderItem} smallView={true} />
          ))}
      </div>
    </>
  );
};

export default Orders;
