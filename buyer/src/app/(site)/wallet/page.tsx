'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { walletApi, WalletData, TransactionData } from '@/services/wallet';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { WalletPageSkeleton } from '@/components/Wallet/SkeletonLoaders';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';
import toast from 'react-hot-toast';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface WalletPageProps {}

const WalletContent: React.FC = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState<number>(50);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const stripe = useStripe();
  const elements = useElements();

  // Load wallet data
  const loadWalletData = async () => {
    try {
      setLoading(true);
      const response = await walletApi.getWallet();
      if (response.success) {
        setWallet(response.data.wallet);
        setRecentTransactions(response.data.recentTransactions);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  // Handle funding wallet
  const handleFundWallet = async () => {
    if (!stripe || !elements) {
      toast.error('Stripe not loaded');
      return;
    }

    if (fundingAmount < 5 || fundingAmount > 1000) {
      toast.error('Amount must be between $5 and $1000');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Create payment intent
      const paymentIntentResponse = await walletApi.createPaymentIntent({
        amount: fundingAmount,
        currency: 'USD'
      });

      if (!paymentIntentResponse.success) {
        throw new Error(paymentIntentResponse.message);
      }

      const { clientSecret, paymentIntentId } = paymentIntentResponse.data;

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm payment on backend
        const confirmResponse = await walletApi.confirmPayment({
          paymentIntentId
        });

        if (confirmResponse.success) {
          toast.success(`Successfully added $${fundingAmount} to your wallet!`);
          setFundingAmount(50); // Reset amount
          loadWalletData(); // Reload wallet data
        } else {
          throw new Error(confirmResponse.message);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <WalletPageSkeleton />;
  }

  if (error) {
    return (
      <section className="overflow-hidden pt-[250px] sm:pt-[180px] lg:pt-[140px] bg-gray-2 pb-15">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center bg-white rounded-lg shadow-2 p-7.5">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red mb-4">Error Loading Wallet</h2>
              <p className="text-dark-3 mb-6">{error}</p>
              <button
                onClick={loadWalletData}
                className="px-6 py-3 bg-blue text-white font-semibold rounded-md hover:bg-blue-dark transition-colors ease-out duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden pt-[250px] sm:pt-[180px] lg:pt-[200px] bg-gray-2 pb-15">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* Header */}
        <div className="mb-10">
          <div>
            <span className="flex items-center gap-2.5 font-medium text-dark mb-1.5">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 7C13.4 7 14.8 8.6 14.8 10V11.5C15.4 11.5 16 12.1 16 12.7V16.7C16 17.4 15.4 18 14.8 18H9.2C8.6 18 8 17.4 8 16.8V12.8C8 12.2 8.6 11.6 9.2 11.6V10C9.2 8.6 10.6 7 12 7ZM12 8.2C11.2 8.2 10.5 8.9 10.5 9.7V11.2H13.5V9.7C13.5 8.9 12.8 8.2 12 8.2Z"
                  fill="#3C50E0"
                />
              </svg>
              Wallet Management
            </span>
            <h1 className="font-semibold text-xl xl:text-heading-5 text-dark">
              My Wallet
            </h1>
          </div>
        </div>

        {/* Wallet Balance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7.5 mb-10">
          {/* Main Balance Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue to-blue-dark rounded-lg shadow-2 p-7.5 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-medium opacity-90">Current Balance</h2>
                <p className="text-4xl lg:text-5xl font-bold mt-2">
                  {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
                </p>
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm opacity-90">
              <span>Available for purchases</span>
              <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                {wallet?.currency || 'USD'}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="space-y-5">
            <div className="bg-white rounded-lg shadow-2 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-3 mb-1">Total Funded</p>
                  <p className="text-xl font-bold text-green">
                    {wallet ? formatCurrency(wallet.totalFunded, wallet.currency) : '$0.00'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-2 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-3 mb-1">Total Spent</p>
                  <p className="text-xl font-bold text-red">
                    {wallet ? formatCurrency(wallet.totalSpent, wallet.currency) : '$0.00'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fund Wallet Section */}
        <div className="bg-white rounded-lg shadow-2 p-7.5 mb-10">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-dark">Add Funds</h3>
              <p className="text-sm text-dark-3">Top up your wallet to make purchases</p>
            </div>
          </div>



          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Amount (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Minimum: $5, Maximum: $1000</p>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Quick Select
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 200].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setFundingAmount(amount)}
                      className={`py-2 px-3 text-sm font-medium rounded-md border transition-colors ease-out duration-200 ${
                        fundingAmount === amount
                          ? 'bg-blue text-white border-blue'
                          : 'bg-gray-1 text-dark border-gray-3 hover:bg-dark hover:text-white hover:border-transparent'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Payment Method
              </label>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#374151',
                        fontFamily: 'system-ui, sans-serif',
                        '::placeholder': {
                          color: '#9CA3AF',
                        },
                      },
                    },
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secured by Stripe
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleFundWallet}
              disabled={isProcessingPayment || !stripe || !elements}
              className="px-8 py-3 bg-blue text-white font-semibold rounded-md hover:bg-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors ease-out duration-200 flex items-center justify-center"
            >
              {isProcessingPayment ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                `Add ${formatCurrency(fundingAmount)}`
              )}
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-2 p-7.5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-dark">Recent Transactions</h3>
                <p className="text-sm text-dark-3">Your latest wallet activity</p>
              </div>
            </div>
            {recentTransactions.length > 0 && (
              <button
                onClick={loadWalletData}
                className="px-4 py-2 text-sm font-medium text-blue hover:text-blue-dark border border-blue-light-5 hover:border-blue-light-4 rounded-md transition-colors ease-out duration-200"
              >
                Refresh
              </button>
            )}
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-dark mb-2">No transactions yet</h4>
              <p className="text-dark-3 mb-4">Your transaction history will appear here once you start using your wallet.</p>
              <button
                onClick={() => {
                  const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                  input?.focus();
                }}
                className="px-4 py-2 bg-blue text-white font-medium rounded-md hover:bg-blue-dark transition-colors ease-out duration-200"
              >
                Add Funds to Get Started
              </button>
            </div>
          ) : (
            <div className="overflow-hidden">
              {/* Mobile View */}
              <div className="block lg:hidden space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.externalId} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize text-dark">{transaction.type}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-dark">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </span>
                      <span className="text-sm text-dark-3">
                        {formatDate(transaction.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-dark-3">{transaction.description}</p>
                  </div>
                ))}
              </div>

              {/* Desktop View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 font-semibold text-dark">Type</th>
                      <th className="text-left py-4 px-4 font-semibold text-dark">Amount</th>
                      <th className="text-left py-4 px-4 font-semibold text-dark">Status</th>
                      <th className="text-left py-4 px-4 font-semibold text-dark">Date</th>
                      <th className="text-left py-4 px-4 font-semibold text-dark">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((transaction, index) => (
                      <tr key={transaction.externalId} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              transaction.type === 'funding' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {transaction.type === 'funding' ? (
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              )}
                            </div>
                            <span className="capitalize font-medium">{transaction.type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-dark">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-dark-3">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-sm text-dark-3">
                          {transaction.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const WalletPage: React.FC<WalletPageProps> = () => {
  const { token } = useSelector((state: any) => state.authReducer);
  const { isRefreshing } = useAuthRefresh();
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const getVerifyToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('verifyToken');
    }
    return null;
  };

  // Check if we're fully authenticated
  const isFullyAuthenticated = (): boolean => {
    const verifyToken = getVerifyToken();
    return !!(token && verifyToken);
  };

  // Handle authentication check with refresh support
  useEffect(() => {
    // If we're already fully authenticated, we're good
    if (isFullyAuthenticated()) {
      setHasCheckedAuth(true);
      return;
    }

    // If we're currently refreshing, wait for it to complete
    if (isRefreshing) {
      return;
    }

    // If we have verifyToken but no token, the AuthProvider should handle refresh
    // Give it some time to work
    if (getVerifyToken() && !token) {
      const timer = setTimeout(() => {
        // If still no token after waiting, redirect to signin
        if (!token) {
          router.push('/signin?redirect=/wallet');
        }
        setHasCheckedAuth(true);
      }, 1000); // Wait 1 second for refresh to complete

      return () => clearTimeout(timer);
    }

    // If no verifyToken and no token, redirect immediately
    if (!getVerifyToken() && !token) {
      router.push('/signin?redirect=/wallet');
      setHasCheckedAuth(true);
      return;
    }

    setHasCheckedAuth(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isRefreshing, router]);

  // Show loading while checking authentication or refreshing
  if (!hasCheckedAuth || isRefreshing || (!token && getVerifyToken())) {
    return (
      <section className="overflow-hidden pt-[250px] sm:pt-[180px] lg:pt-[140px] bg-gray-2 pb-15">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue mx-auto mb-4"></div>
              <p className="text-dark-3">
                {isRefreshing ? 'Refreshing authentication...' : 'Checking authentication...'}
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // If we don't have a token at this point, we should have been redirected
  if (!token) {
    return null;
  }

  return (
    <Elements stripe={stripePromise}>
      <WalletContent />
    </Elements>
  );
};

export default WalletPage;
