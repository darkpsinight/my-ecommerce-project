'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatCurrency } from '@/utils/currency';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutModalProps {
  isOpen: boolean;
  closeModal: () => void;
  clientSecret: string;
  amount: number;
  currency?: string;
  onPaymentSuccess: (paymentIntentId: string) => void;
}

const CheckoutForm = ({ amount, currency, onSuccess, onCancel }: {
  amount: number,
  currency: string,
  onSuccess: (id: string) => void,
  onCancel: () => void
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/wallet', // Fallback
        },
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else {
        setErrorMessage('Unexpected payment status: ' + (paymentIntent?.status || 'unknown'));
        setIsProcessing(false);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'An unexpected error occurred');
      setIsProcessing(false);
    }
  };

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100); // Display in dollars

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Fund Wallet</h2>
        <p className="text-gray-600 mb-4">Adding <span className="font-bold text-dark">{formattedAmount}</span> to your wallet.</p>

        <PaymentElement />

        {errorMessage && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-4 py-3 bg-blue text-white font-semibold rounded-xl hover:bg-blue-dark transition-colors disabled:opacity-50 flex justify-center items-center"
        >
          {isProcessing ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            `Pay ${formattedAmount}`
          )}
        </button>
      </div>
    </form>
  );
};

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  closeModal,
  clientSecret,
  amount,
  currency = 'USD',
  onPaymentSuccess
}) => {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen || !clientSecret) return null;

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-md p-6 sm:p-8">
          <Elements stripe={stripePromise} options={{
            clientSecret,
            appearance: { theme: 'stripe' }
          }}>
            <CheckoutForm
              amount={amount}
              currency={currency}
              onSuccess={onPaymentSuccess}
              onCancel={closeModal}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;