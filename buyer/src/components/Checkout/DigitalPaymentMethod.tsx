import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { removeAllItemsFromCart } from "@/redux/features/cart-slice";
import { ordersApi } from "@/services/orders";
import { walletApi } from "@/services/wallet";
import toast from "react-hot-toast";

interface CartItem {
  id: number;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
}

interface DigitalPaymentMethodProps {
  totalPrice: number;
  cartItems: CartItem[];
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const DigitalPaymentMethod: React.FC<DigitalPaymentMethodProps> = ({
  totalPrice,
  cartItems,
  isProcessing,
  setIsProcessing,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const router = useRouter();
  const dispatch = useDispatch();
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const response = await walletApi.getWallet();
        if (response.success) {
          setWalletBalance(response.data.wallet.balance);
        }
      } catch (error) {
        console.error("Failed to fetch wallet balance", error);
      }
    };

    fetchWalletBalance();
  }, []);

  const handlePayment = async () => {
    if (isProcessing) return;

    // Check if wallet has sufficient balance
    if (walletBalance < totalPrice) {
      toast.error(
        `Insufficient wallet balance. You need $${(
          totalPrice - walletBalance
        ).toFixed(2)} more.`
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Convert cart items to the format expected by the API
      // Note: item.id is actually the externalId (UUID) from the listing
      const orderCartItems = cartItems.map((item) => ({
        listingId: item.id.toString(), // Use externalId (UUID)
        quantity: item.quantity,
      }));

      console.log("=== FRONTEND DEBUG ===");
      console.log("Cart items:", cartItems);
      console.log("Order cart items:", orderCartItems);
      console.log("Payment method:", paymentMethod);
      console.log("Total price:", totalPrice);

      // Create order
      const orderResponse = await ordersApi.createOrder({
        cartItems: orderCartItems,
        paymentMethod: paymentMethod as "stripe" | "wallet",
      });

      if (orderResponse.success) {
        // Clear cart
        dispatch(removeAllItemsFromCart());

        if (paymentMethod === "wallet") {
          // Wallet payment is processed immediately
          toast.success("Payment successful! Your codes are ready.");
          router.push(`/order-success?orderId=${orderResponse.data.orderId}`);
        } else {
          // Only wallet payments are allowed
          toast.error("Only wallet payments are supported.");
        }
      } else {
        toast.error("Failed to create order. Please try again.");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error data:", error.response?.data);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Payment failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="bg-white shadow-1 rounded-[10px]">
        <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
          <h3 className="font-medium text-xl text-dark">Payment Method</h3>
        </div>

        <div className="p-4 sm:p-8.5">
          <div className="space-y-4">
            {/* Wallet Payment - Only Payment Method */}
            <div className="rounded-md border-[0.5px] py-4 px-5 border-transparent bg-gray-2 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span className="font-medium text-dark">Wallet Balance</span>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm ${
                      walletBalance >= totalPrice
                        ? "text-gray-600"
                        : "text-red-600 font-medium"
                    }`}
                  >
                    Available: ${walletBalance.toFixed(2)}
                  </p>
                  {walletBalance < totalPrice && (
                    <p className="text-xs text-red-500 mt-1">
                      Need ${(totalPrice - walletBalance).toFixed(2)} more
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                All payments are processed through your wallet balance for
                security.
                <a
                  href="/wallet"
                  className="text-blue-600 hover:underline ml-1"
                >
                  Add funds
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 text-sm mb-1">
              Secure & Protected
            </h4>
            <p className="text-gray-700 text-xs">
              Your payment information is encrypted and secure. We never store
              your card details.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing || walletBalance < totalPrice}
        className={`w-full flex justify-center items-center font-medium text-white py-4 px-6 rounded-md ease-out duration-200 ${
          isProcessing || walletBalance < totalPrice
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue hover:bg-blue-dark"
        }`}
      >
        {isProcessing ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </>
        ) : walletBalance < totalPrice ? (
          <>Insufficient Funds - ${totalPrice.toFixed(2)}</>
        ) : (
          <>Complete Purchase - ${totalPrice.toFixed(2)}</>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center">
        By completing your purchase, you agree to our{" "}
        <a href="/terms" className="text-blue-600 hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
};

export default DigitalPaymentMethod;
