import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearCartAsync } from "@/redux/features/cart-slice";
import { useAppDispatch } from "@/redux/store";
import { ordersApi } from "@/services/orders";
import { walletApi } from "@/services/wallet";
import toast from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeCheckoutForm from "./StripeCheckoutForm";

// Initialize Stripe outside component to avoid recreation
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

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
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "stripe">("wallet");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Stripe state
  const [stripeClientSecrets, setStripeClientSecrets] = useState<string[]>([]);
  const [checkoutGroupId, setCheckoutGroupId] = useState<string>("");
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [isStripeReady, setIsStripeReady] = useState(false);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        setLoadingBalance(true);
        const response = await walletApi.getWallet();
        if (response.success) {
          // API returns cents. Convert to dollars for usage in UI.
          setWalletBalance(response.data.wallet.balance / 100);
        }
      } catch (error) {
        console.error("Failed to fetch wallet balance", error);
        toast.error("Could not verify wallet balance");
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchWalletBalance();
  }, []);

  const hasInsufficientFunds = walletBalance < totalPrice;

  const handleWalletPayment = async () => {
    if (isProcessing) return;

    if (hasInsufficientFunds) {
      toast.error(`Insufficient wallet balance. Please add funds.`);
      return;
    }

    setIsProcessing(true);

    try {
      const orderCartItems = cartItems.map((item) => ({
        listingId: item.listingId || item.id,
        quantity: item.quantity,
      }));

      const orderResponse = await ordersApi.createOrder({
        cartItems: orderCartItems,
        paymentMethod: "wallet",
      });

      if (orderResponse.success) {
        try {
          await dispatch(clearCartAsync({ silent: true })).unwrap();
        } catch (cartError) {
          console.error("Failed to clear cart:", cartError);
        }
        toast.success("Payment successful! Your codes are ready.");
        router.push(`/order-success?orderId=${orderResponse.data.orderId}`);
      } else {
        toast.error("Failed to create order. Please try again.");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const initStripeSession = async () => {
    setIsProcessing(true);
    try {
      const response = await ordersApi.createCheckoutSession();
      if (response.success) {
        setStripeClientSecrets(response.data.clientSecrets);
        setCheckoutGroupId(response.data.checkoutGroupId);
        setOrderIds(response.data.orders);
        setIsStripeReady(true);
      }
    } catch (error: any) {
      console.error("Stripe init error:", error);
      toast.error("Failed to initialize checkout. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative">
      <div className="space-y-6 pb-32 sm:pb-6">

        {/* Payment Method Selector */}
        <div className="bg-white shadow-1 rounded-[10px] overflow-hidden">
          <div className="border-b border-gray-3 py-5 px-4 sm:px-8.5">
            <h3 className="font-medium text-xl text-dark">Payment Method</h3>
          </div>
          <div className="p-4 sm:p-6 lg:p-8.5 space-y-4">

            {/* Wallet Option */}
            <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'wallet' ? 'border-blue bg-blue/5' : 'border-gray-200 hover:border-blue/50'
              } ${hasInsufficientFunds ? 'opacity-75 bg-gray-50' : ''}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={() => setPaymentMethod('wallet')}
                className="w-5 h-5 text-blue focus:ring-blue"
              />
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-dark">Wallet Balance</span>
                  <span className={`font-bold ${hasInsufficientFunds ? 'text-red' : 'text-dark'}`}>
                    ${walletBalance.toFixed(2)}
                  </span>
                </div>
                {hasInsufficientFunds && (
                  <p className="text-red text-xs mt-1">Insufficient balance for this order</p>
                )}
              </div>
            </label>

            {/* Stripe Option */}
            <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'stripe' ? 'border-blue bg-blue/5' : 'border-gray-200 hover:border-blue/50'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={() => {
                  setPaymentMethod('stripe');
                  setIsStripeReady(false);
                }}
                className="w-5 h-5 text-blue focus:ring-blue"
              />
              <span className="ml-3 font-medium text-dark">Credit/Debit Card</span>
              <div className="ml-auto flex gap-2">
                <span className="text-gray-400 text-sm">Via Stripe</span>
              </div>
            </label>
          </div>
        </div>

        {/* Dynamic Content based on Selection */}
        {paymentMethod === 'wallet' ? (
          <div className="bg-white shadow-1 rounded-[10px] p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Total to pay:</span>
              <span className="text-xl font-bold">${totalPrice.toFixed(2)}</span>
            </div>

            {hasInsufficientFunds ? (
              <div className="p-4 bg-red/10 text-red border border-red/20 rounded-lg text-sm mb-4">
                <p className="font-bold mb-1">Insufficient Wallet Balance</p>
                <p>You have ${walletBalance.toFixed(2)} but need <strong>${totalPrice.toFixed(2)}</strong>.</p>
                <p className="mt-2 text-dark">Please go to your <a href="/wallet" className="underline font-semibold text-blue hover:text-blue-dark">Wallet</a> to add funds.</p>
              </div>
            ) : (
              <button
                onClick={handleWalletPayment}
                disabled={isProcessing}
                className="w-full bg-blue text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-dark transition-colors disabled:opacity-70"
              >
                {isProcessing ? "Processing..." : `Pay $${totalPrice.toFixed(2)} with Wallet`}
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-1 rounded-[10px] p-6">
            {!isStripeReady ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">Secure payment via Stripe</p>
                <button
                  onClick={initStripeSession}
                  disabled={isProcessing}
                  className="w-full bg-blue text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-dark transition-colors"
                >
                  {isProcessing ? "Loading Payment Options..." : "Proceed to Payment Details"}
                </button>
              </div>
            ) : (
              // Render Stripe Element if ready
              stripeClientSecrets.length > 0 && (
                <div className="animate-fade-in">
                  <h4 className="font-medium text-lg mb-4">Enter Card Details</h4>
                  <Elements stripe={stripePromise} options={{
                    clientSecret: stripeClientSecrets[0], // Initialize with the first one
                    appearance: { theme: 'stripe' }
                  }}>
                    <StripeCheckoutForm
                      clientSecrets={stripeClientSecrets}
                      checkoutGroupId={checkoutGroupId}
                      orderIds={orderIds}
                    />
                  </Elements>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalPaymentMethod;


