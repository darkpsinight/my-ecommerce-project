'use client';

import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { walletApi } from '@/services/wallet';
import toast from 'react-hot-toast';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CheckoutModalProps {
  isOpen: boolean;
  closeModal: () => void;
  amount: number;
  currency?: string;
  onPaymentSuccess?: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, 
  closeModal, 
  amount, 
  currency = 'USD',
  onPaymentSuccess 
}) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Close modal on ESC key press
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeModal();
      }
    }

    // Close modal on click outside
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Element;
      if (!target.closest(".modal-content")) {
        closeModal();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, closeModal]);

  // Create checkout session when modal opens
  useEffect(() => {
    if (isOpen && !clientSecret) {
      createCheckoutSession();
    }
  }, [isOpen, clientSecret]);

  const createCheckoutSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await walletApi.createCheckoutSession({
        amount,
        currency
      });

      if (response.success) {
        setClientSecret(response.data.clientSecret);
      } else {
        setError(response.message || 'Failed to create checkout session');
        toast.error(response.message || 'Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      const errorMessage = error.message || 'Failed to create checkout session';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setClientSecret('');
    setError(null);
    closeModal();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-0 left-0 overflow-y-auto no-scrollbar w-full h-screen sm:py-12 xl:py-16 2xl:py-20 bg-dark/70 sm:px-6 px-4 py-4 ${
        isOpen ? "block z-99999" : "hidden"
      }`}
    >
      <div className="flex items-center justify-center min-h-full">
        <div className="w-full max-w-[480px] sm:max-w-[520px] rounded-xl shadow-3 bg-white p-4 sm:p-6 relative modal-content">
          {/* Close Button - Responsive */}
          <button
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close modal"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center justify-center gap-1 px-2 py-1 sm:w-10 sm:h-10 rounded-full ease-in duration-150 bg-meta text-body hover:text-dark disabled:opacity-50 disabled:cursor-not-allowed z-10"
          >
            {/* Mobile/Tablet: Show "Close" text */}
            <span className="text-xs font-medium sm:hidden">Close</span>
            
            {/* Desktop: Show X icon */}
            <svg
              className="fill-current w-4 h-4 sm:w-6 sm:h-6 hidden sm:block"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.3108 13L19.2291 8.08167C19.5866 7.72417 19.5866 7.12833 19.2291 6.77083C19.0543 6.59895 18.8189 6.50262 18.5737 6.50262C18.3285 6.50262 18.0932 6.59895 17.9183 6.77083L13 11.6892L8.08164 6.77083C7.90679 6.59895 7.67142 6.50262 7.42623 6.50262C7.18104 6.50262 6.94566 6.59895 6.77081 6.77083C6.41331 7.12833 6.41331 7.72417 6.77081 8.08167L11.6891 13L6.77081 17.9183C6.41331 18.2758 6.41331 18.8717 6.77081 19.2292C7.12831 19.5867 7.72414 19.5867 8.08164 19.2292L13 14.3108L17.9183 19.2292C18.2758 19.5867 18.8716 19.5867 19.2291 19.2292C19.5866 18.8717 19.5866 18.2758 19.2291 17.9183L14.3108 13Z"
                fill=""
              />
            </svg>
          </button>

          <div>
            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">Secure Checkout</h2>
              <p className="text-sm text-body mb-3 sm:mb-4">Complete your wallet funding securely with Stripe</p>
              
              {/* Amount Summary */}
              <div className="bg-blue-light-5/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-light-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-dark mb-1">Wallet Funding</h3>
                    <p className="text-xs sm:text-sm text-body">Add funds to your digital wallet</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-bold text-dark">
                      {formatCurrency(amount, currency)}
                    </div>
                    <div className="text-xs sm:text-sm text-body">{currency.toUpperCase()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-8 sm:py-10">
                <div className="flex flex-col items-center">
                  <svg className="animate-spin h-6 w-6 sm:h-8 sm:w-8 text-blue mb-3 sm:mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-sm sm:text-base text-body text-center">Preparing secure checkout...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-700 text-sm">{error}</p>
                    <button
                      onClick={createCheckoutSession}
                      className="mt-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white text-xs sm:text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stripe Embedded Checkout */}
            {clientSecret && !error && (
              <div className="stripe-checkout-container">
                <EmbeddedCheckoutProvider
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    onComplete: () => {
                      toast.success(`Successfully added ${formatCurrency(amount)} to your wallet!`);
                      onPaymentSuccess?.();
                      handleClose();
                    }
                  }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;