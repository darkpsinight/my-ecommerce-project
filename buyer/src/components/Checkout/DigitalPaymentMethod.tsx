import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearCartAsync } from "@/redux/features/cart-slice";
import { useAppDispatch } from "@/redux/store";
import { ordersApi } from "@/services/orders";
import { walletApi } from "@/services/wallet";
import toast from "react-hot-toast";

interface CartItem {
  id: string;
  listingId: string;
  title: string;
  price: number;
  discountedPrice: number;
  quantity: number;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
  sellerId: string;
  listingSnapshot?: {
    category?: string;
    subcategory?: string;
    platform?: string;
    region?: string;
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
  const dispatch = useAppDispatch();
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
      // Use the listingId field which is the UUID from the listing
      const orderCartItems = cartItems.map((item) => ({
        listingId: item.listingId || item.id, // Use listingId (UUID) or fallback to id
        quantity: item.quantity,
      }));

      // Debug logging (can be removed in production)
      console.log("Processing payment with cart items:", orderCartItems);

      // Create order
      const orderResponse = await ordersApi.createOrder({
        cartItems: orderCartItems,
        paymentMethod: paymentMethod as "stripe" | "wallet",
      });

      if (orderResponse.success) {
        // Clear cart both frontend and backend silently (this ensures consistency)
        try {
          await dispatch(clearCartAsync({ silent: true })).unwrap();
        } catch (cartError) {
          console.error("Failed to clear cart:", cartError);
          // Don't fail the checkout process if cart clearing fails
        }

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
      {/* Wallet Balance Display */}
      <div className="bg-white shadow-1 rounded-[10px]">
        <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
          <h3 className="font-medium text-xl text-dark">Wallet Balance</h3>
        </div>

        <div className="p-4 sm:p-6 lg:p-8.5">
          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-br from-blue to-blue-dark rounded-lg p-4 sm:p-6 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white/80 text-xs sm:text-sm mb-1">Available Balance</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                    ${walletBalance.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className={`inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                  walletBalance >= totalPrice 
                    ? "bg-green/20 text-green-light-2 border border-green/30" 
                    : "bg-red/20 text-red-light-2 border border-red/30"
                }`}>
                  {walletBalance >= totalPrice ? (
                    <>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Sufficient
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Insufficient
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {walletBalance < totalPrice && (
              <div className="mt-4 p-3 bg-red/20 border border-red/30 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-light-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-light-2 font-medium text-xs sm:text-sm">
                      Need ${(totalPrice - walletBalance).toFixed(2)} more to complete this purchase
                    </p>
                    <a
                      href="/wallet"
                      className="text-white font-medium text-xs sm:text-sm hover:underline inline-flex items-center mt-1"
                    >
                      Add funds to wallet
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Purchase Summary */}
          <div className="mt-4 sm:mt-6 bg-gray-1 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between text-xs sm:text-sm text-dark-3 mb-2">
              <span>Purchase Amount:</span>
              <span className="font-medium">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm text-dark-3 mb-2">
              <span>Current Balance:</span>
              <span className="font-medium">${walletBalance.toFixed(2)}</span>
            </div>
            <hr className="border-gray-3 my-2" />
            <div className="flex items-center justify-between font-medium text-sm sm:text-base">
              <span>After Purchase:</span>
              <span className={`${
                walletBalance >= totalPrice ? "text-blue" : "text-red"
              }`}>
                ${walletBalance >= totalPrice ? (walletBalance - totalPrice).toFixed(2) : "Insufficient"}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 text-center">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            All payments are securely processed through your wallet balance
          </p>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing || walletBalance < totalPrice}
        className={`w-full flex justify-center items-center font-medium text-white py-3 sm:py-4 px-4 sm:px-6 rounded-md ease-out duration-200 text-sm sm:text-base ${
          isProcessing || walletBalance < totalPrice
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue hover:bg-blue-dark"
        }`}
      >
        {isProcessing ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
            <span className="hidden sm:inline">Processing...</span>
            <span className="sm:hidden">Processing</span>
          </>
        ) : walletBalance < totalPrice ? (
          <>
            <span className="hidden sm:inline">Insufficient Funds - ${totalPrice.toFixed(2)}</span>
            <span className="sm:hidden">Insufficient Funds</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Complete Purchase - ${totalPrice.toFixed(2)}</span>
            <span className="sm:hidden">Complete - ${totalPrice.toFixed(2)}</span>
          </>
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-gray-500 text-center px-2 sm:px-0">
        By completing your purchase, you agree to our{" "}
        <a href="/terms" className="text-blue hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-blue hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
};

export default DigitalPaymentMethod;
