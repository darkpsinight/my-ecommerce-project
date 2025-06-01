import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { removeAllItemsFromCart } from "@/redux/features/cart-slice";
import { ordersApi } from "@/services/orders";
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
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const router = useRouter();
  const dispatch = useDispatch();

  const handlePayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      // Convert cart items to the format expected by the API
      // Note: item.id is actually the externalId (UUID) from the listing
      const orderCartItems = cartItems.map(item => ({
        listingId: item.id.toString(), // Use externalId (UUID)
        quantity: item.quantity
      }));

      // Create order
      const orderResponse = await ordersApi.createOrder({
        cartItems: orderCartItems,
        paymentMethod: paymentMethod as 'stripe' | 'wallet'
      });

      if (orderResponse.success) {
        // Clear cart
        dispatch(removeAllItemsFromCart());

        if (paymentMethod === "stripe" && orderResponse.data.clientSecret) {
          // For Stripe, we would normally redirect to Stripe Checkout or use Stripe Elements
          // For now, simulate successful payment
          toast.success("Order created successfully! Redirecting to payment...");
          setTimeout(() => {
            router.push(`/order-success?orderId=${orderResponse.data.orderId}`);
          }, 1500);
        } else if (paymentMethod === "wallet") {
          // Wallet payment is processed immediately
          toast.success("Payment successful! Your codes are ready.");
          router.push(`/order-success?orderId=${orderResponse.data.orderId}`);
        }
      } else {
        toast.error("Failed to create order. Please try again.");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      const errorMessage = error.response?.data?.error || error.message || "Payment failed. Please try again.";
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
            {/* Stripe Payment */}
            <label
              htmlFor="stripe"
              className="flex cursor-pointer select-none items-center gap-4"
            >
              <div className="relative">
                <input
                  type="radio"
                  name="payment"
                  id="stripe"
                  className="sr-only"
                  checked={paymentMethod === "stripe"}
                  onChange={() => setPaymentMethod("stripe")}
                />
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    paymentMethod === "stripe"
                      ? "border-4 border-blue"
                      : "border border-gray-4"
                  }`}
                ></div>
              </div>

              <div
                className={`rounded-md border-[0.5px] py-4 px-5 ease-out duration-200 hover:bg-gray-2 hover:border-transparent hover:shadow-none flex-1 ${
                  paymentMethod === "stripe"
                    ? "border-transparent bg-gray-2"
                    : "border-gray-4 shadow-1"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-8 h-5" viewBox="0 0 40 24" fill="none">
                        <rect width="40" height="24" rx="4" fill="#635BFF"/>
                        <path d="M16.3 9.5c0-.8-.5-1.3-1.4-1.3h-2.2v2.6h2.2c.9 0 1.4-.5 1.4-1.3zm-1.4 2.1h-2.2v2.8h-1.5V7.4h3.7c1.7 0 2.9 1 2.9 2.6s-1.2 2.6-2.9 2.6z" fill="white"/>
                        <path d="M23.8 14.4c-1.6 0-2.8-1.2-2.8-2.9s1.2-2.9 2.8-2.9 2.8 1.2 2.8 2.9-1.2 2.9-2.8 2.9zm0-1.2c.9 0 1.5-.7 1.5-1.7s-.6-1.7-1.5-1.7-1.5.7-1.5 1.7.6 1.7 1.5 1.7z" fill="white"/>
                      </svg>
                      <span className="font-medium text-dark">Credit/Debit Card</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-8 h-5" viewBox="0 0 40 24" fill="none">
                      <rect width="40" height="24" rx="4" fill="#EB001B"/>
                      <rect x="15" y="0" width="10" height="24" fill="#FF5F00"/>
                      <rect x="20" y="0" width="20" height="24" rx="4" fill="#F79E1B"/>
                    </svg>
                    <svg className="w-8 h-5" viewBox="0 0 40 24" fill="none">
                      <rect width="40" height="24" rx="4" fill="#0066B2"/>
                      <path d="M18.5 7.5h3v9h-3v-9z" fill="white"/>
                      <path d="M15 12c0-1.8.8-3.4 2-4.5-1.2-.9-2.7-1.5-4.3-1.5-3.9 0-7 3.1-7 7s3.1 7 7 7c1.6 0 3.1-.6 4.3-1.5-1.2-1.1-2-2.7-2-4.5z" fill="white"/>
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Secure payment with Stripe. All major cards accepted.
                </p>
              </div>
            </label>

            {/* Wallet Payment */}
            <label
              htmlFor="wallet"
              className="flex cursor-pointer select-none items-center gap-4"
            >
              <div className="relative">
                <input
                  type="radio"
                  name="payment"
                  id="wallet"
                  className="sr-only"
                  checked={paymentMethod === "wallet"}
                  onChange={() => setPaymentMethod("wallet")}
                />
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    paymentMethod === "wallet"
                      ? "border-4 border-blue"
                      : "border border-gray-4"
                  }`}
                ></div>
              </div>

              <div
                className={`rounded-md border-[0.5px] py-4 px-5 ease-out duration-200 hover:bg-gray-2 hover:border-transparent hover:shadow-none flex-1 ${
                  paymentMethod === "wallet"
                    ? "border-transparent bg-gray-2"
                    : "border-gray-4 shadow-1"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-medium text-dark">Wallet Balance</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Available: $0.00</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Pay instantly using your wallet balance.
                  <a href="/wallet" className="text-blue-600 hover:underline ml-1">
                    Add funds
                  </a>
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 text-sm mb-1">
              Secure & Protected
            </h4>
            <p className="text-gray-700 text-xs">
              Your payment information is encrypted and secure. We never store your card details.
            </p>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`w-full flex justify-center items-center font-medium text-white py-4 px-6 rounded-md ease-out duration-200 ${
          isProcessing
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue hover:bg-blue-dark"
        }`}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            Complete Purchase - ${totalPrice.toFixed(2)}
          </>
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
