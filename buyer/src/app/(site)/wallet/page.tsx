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

    if (fundingAmount < 5) {
      toast.error('Amount must be at least $5');
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
      <section className="overflow-hidden pt-[250px] sm:pt-[200px] lg:pt-[200px] bg-gray-2 pb-15">
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
    <section className="min-h-screen bg-gradient-to-br from-blue-light-5 via-gray-1 to-blue-light-5 pt-[250px] sm:pt-[200px] lg:pt-[200px] pb-8">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">

        {/* Hero Balance Card - Prominent Display */}
        <div className="mb-6 sm:mb-8">
          <div className="relative">
            {/* Main Balance Card */}
            <div className="bg-gradient-to-br from-blue via-blue-dark to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-3 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-white/20"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-white/10"></div>
              </div>

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/80 text-sm font-medium">Digital Wallet</p>
                      <p className="text-xs text-white/60">Available Balance</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60">Last updated</p>
                    <p className="text-sm text-white/80">Just now</p>
                  </div>
                </div>

                {/* Balance Display */}
                <div className="text-center mb-6">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2">
                    {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
                  </div>
                  <p className="text-white/80 text-base">Available for purchases</p>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-lg sm:text-xl font-bold mb-1">
                      {wallet ? formatCurrency(wallet.totalFunded, wallet.currency) : '$0.00'}
                    </div>
                    <p className="text-white/70 text-xs sm:text-sm">Total Funded</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-lg sm:text-xl font-bold mb-1">
                      {wallet ? formatCurrency(wallet.totalSpent, wallet.currency) : '$0.00'}
                    </div>
                    <p className="text-white/70 text-xs sm:text-sm">Total Spent</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Add Funds Section - More Compact */}
          <div className="bg-white rounded-2xl shadow-1 border border-gray-3 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-light-5 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-dark">Add Funds</h3>
                <p className="text-sm text-body">Quick & secure payments</p>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">$</span>
                </div>
                <input
                  type="number"
                  min="5"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(Number(e.target.value))}
                  onWheel={(event) => event.currentTarget.blur()}
                  className="w-full pl-7 pr-4 py-3 border-2 border-gray-3 rounded-xl focus:border-blue focus:ring-2 focus:ring-blue-light-5 outline-none transition-all duration-200 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-4">
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 100, 200].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setFundingAmount(amount)}
                    className={`py-2 px-3 text-sm font-medium rounded-lg border-2 transition-colors ease-out duration-200 ${
                      fundingAmount === amount
                        ? 'bg-blue text-white border-blue'
                        : 'bg-gray-1 text-dark border-gray-3 hover:bg-blue hover:text-white hover:border-blue'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method - Single Active Method */}
            <div className="mb-4">
              <div className="rounded-xl border-2 border-blue-light-4 bg-blue-light-5/30 p-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-light-4 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-dark text-sm">Credit/Debit Card</h4>
                    <p className="text-xs text-body">Secured by Stripe</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue text-white">
                    Active
                  </span>
                </div>
                
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mb-3">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '14px',
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

                <button
                  onClick={handleFundWallet}
                  disabled={isProcessingPayment || !stripe || !elements}
                  className="w-full font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 text-sm bg-blue text-white hover:bg-blue-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isProcessingPayment ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

            {/* Coming Soon - Ultra Compact */}
            <div className="bg-gray-1 rounded-lg p-3 text-center">
              <p className="text-xs text-body mb-1">More payment options</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500">PayPal • Crypto</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Soon
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity - Compact */}
          <div className="bg-white rounded-2xl shadow-1 border border-gray-3 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-light-5 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark">Recent Activity</h3>
                  <p className="text-sm text-body">Your latest transactions</p>
                </div>
              </div>
              {recentTransactions.length > 0 && (
                <button
                  onClick={loadWalletData}
                  className="text-blue hover:text-blue-dark text-sm font-medium"
                >
                  Refresh
                </button>
              )}
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-medium text-dark mb-2">No transactions yet</h4>
                <p className="text-body text-sm mb-4">Your transaction history will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.externalId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'funding' ? 'bg-green-light-5' : 'bg-red-light-5'
                    }`}>
                      {transaction.type === 'funding' ? (
                        <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-dark truncate capitalize">
                        {transaction.type} - {transaction.description}
                      </p>
                      <p className="text-xs text-body">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        transaction.type === 'funding' ? 'text-green' : 'text-red'
                      }`}>
                        {transaction.type === 'funding' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security Notice - Bottom */}
        <div className="bg-white rounded-2xl shadow-1 border border-gray-3 p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-light-5 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-dark mb-1">Bank-Level Security</h4>
              <p className="text-sm text-body">Your funds are protected with industry-standard encryption and secure payment processing by Stripe.</p>
            </div>
          </div>
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
      <section className="overflow-hidden pt-[250px] sm:pt-[200px] lg:pt-[200px] bg-gray-2 pb-15">
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
