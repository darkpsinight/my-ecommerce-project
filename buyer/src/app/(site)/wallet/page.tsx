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
  const [isRefreshingTransactions, setIsRefreshingTransactions] = useState(false);
  const [isRefreshingWallet, setIsRefreshingWallet] = useState(false);

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

  // Load only recent transactions
  const loadRecentTransactions = async () => {
    try {
      setIsRefreshingTransactions(true);
      const response = await walletApi.getWallet();
      if (response.success) {
        setRecentTransactions(response.data.recentTransactions);
        toast.success('Transactions refreshed successfully');
      } else {
        toast.error('Failed to refresh transactions');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh transactions');
    } finally {
      setIsRefreshingTransactions(false);
    }
  };

  // Load only wallet balance data
  const loadWalletBalance = async () => {
    try {
      setIsRefreshingWallet(true);
      const response = await walletApi.getWallet();
      if (response.success) {
        setWallet(response.data.wallet);
        toast.success('Wallet balance refreshed successfully');
      } else {
        toast.error('Failed to refresh wallet balance');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh wallet balance');
    } finally {
      setIsRefreshingWallet(false);
    }
  };

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
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Digital Wallet",
            "description": "Secure digital wallet for managing funds, adding money, and tracking transactions",
            "url": "https://example.com/wallet",
            "mainEntity": {
              "@type": "FinancialProduct",
              "name": "Digital Wallet",
              "description": "Secure fund management with bank-level security",
              "provider": {
                "@type": "Organization",
                "name": "Digital Marketplace"
              },
              "feesAndCommissionsSpecification": "Transparent fee structure with no hidden charges"
            },
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://example.com/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Wallet",
                  "item": "https://example.com/wallet"
                }
              ]
            }
          })
        }}
      />

      <section className="min-h-screen bg-gradient-to-br from-blue-light-5 via-gray-1 to-blue-light-5 pt-[250px] sm:pt-[200px] lg:pt-[200px] pb-8">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          
          {/* Page Title - Hidden but accessible for SEO */}
          <h1 className="sr-only">Digital Wallet - Secure Fund Management</h1>

          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <a href="/" className="text-body hover:text-blue transition-colors duration-200">
                  Home
                </a>
              </li>
              <li aria-hidden="true" className="text-gray-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li aria-current="page" className="text-dark font-medium">
                Digital Wallet
              </li>
            </ol>
          </nav>

        {/* Hero Balance Card - Prominent Display */}
        <div className="mb-6 sm:mb-8">
          <div className="relative">
            {/* Main Balance Card */}
            <div className="relative rounded-3xl p-6 sm:p-8 shadow-3 overflow-hidden">
              {/* Controlled Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-dark to-blue"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue/90 via-blue-dark/95 to-blue-dark"></div>
              
              {/* Subtle overlay for text contrast */}
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* Subtle Background Pattern */}
              <div className="absolute inset-0 opacity-[0.04]">
                <div className="absolute bottom-8 left-8 w-20 h-20 rounded-full border border-white/20"></div>
                <div className="absolute top-1/2 right-8 w-16 h-16 rounded-full border border-white/15"></div>
              </div>

              <div className="relative z-10 text-white">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-white text-sm font-semibold">Digital Wallet</h2>
                      <p className="text-white/90 text-xs">Available Balance</p>
                    </div>
                  </div>
                  <button
                    onClick={loadWalletBalance}
                    disabled={isRefreshingWallet}
                    className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl px-3 py-2 hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRefreshingWallet ? (
                      <>
                        <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-white/95 text-xs font-medium">Refreshing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-white text-sm font-semibold">Refresh</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Balance Display */}
                <div className="text-center mb-6">
                  <div className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_40%)]">
                    {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
                  </div>
                  <p className="text-white/95 text-base font-medium">Available for purchases</p>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-300">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-500/30 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-white/90 text-xs font-medium">Total Funded</p>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white">
                      {wallet ? formatCurrency(wallet.totalFunded, wallet.currency) : '$0.00'}
                    </div>
                  </div>
                  <div className="bg-white/15 backdrop-blur-sm border border-white/25 rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-300">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-orange-500/30 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </div>
                      <p className="text-white/90 text-xs font-medium">Total Spent</p>
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white">
                      {wallet ? formatCurrency(wallet.totalSpent, wallet.currency) : '$0.00'}
                    </div>
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
                <h3 className="text-lg font-bold text-dark">Add Funds to Wallet</h3>
                <p className="text-sm text-body">Quick & secure payments via Stripe</p>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label htmlFor="funding-amount" className="block text-sm font-medium text-dark mb-2">
                Amount to add (USD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium" aria-hidden="true">$</span>
                </div>
                <input
                  id="funding-amount"
                  name="funding-amount"
                  type="number"
                  min="5"
                  max="10000"
                  step="0.01"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(Number(e.target.value))}
                  onWheel={(event) => event.currentTarget.blur()}
                  className="w-full pl-7 pr-4 py-3 border-2 border-gray-3 rounded-xl focus:border-blue focus:ring-2 focus:ring-blue-light-5 outline-none transition-all duration-200 font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Enter amount (minimum $5)"
                  aria-describedby="funding-amount-help"
                />
              </div>
              <p id="funding-amount-help" className="mt-1 text-xs text-body">
                Minimum amount: $5.00 | Maximum amount: $10,000.00
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-4">
              <fieldset>
                <legend className="block text-sm font-medium text-dark mb-2">
                  Quick amount selection
                </legend>
                <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="quick-amounts">
                  {[25, 50, 100, 200].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFundingAmount(amount)}
                      className={`py-2 px-3 text-sm font-medium rounded-lg border-2 transition-colors ease-out duration-200 ${
                        fundingAmount === amount
                          ? 'bg-blue text-white border-blue'
                          : 'bg-gray-1 text-dark border-gray-3 hover:bg-blue hover:text-white hover:border-blue'
                      }`}
                      aria-pressed={fundingAmount === amount}
                      aria-label={`Set amount to ${amount} dollars`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            {/* Payment Method - Single Active Method */}
            <div className="mb-4">
              <h4 className="block text-sm font-medium text-dark mb-3">Payment Method</h4>
              <div className="rounded-xl border-2 border-blue-light-4 bg-blue-light-5/30 p-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-blue-light-4 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-dark text-sm">Credit/Debit Card</h5>
                    <p className="text-xs text-body">Secured by Stripe - Industry standard encryption</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue text-white">
                    Active
                  </span>
                </div>
                
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 mb-3">
                  <label htmlFor="card-element" className="sr-only">
                    Credit or debit card information
                  </label>
                  <CardElement
                    id="card-element"
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
                  type="button"
                  onClick={handleFundWallet}
                  disabled={isProcessingPayment || !stripe || !elements}
                  aria-describedby="add-funds-status"
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
                <div id="add-funds-status" className="sr-only" aria-live="polite">
                  {isProcessingPayment ? 'Processing payment...' : 'Ready to add funds'}
                </div>
              </div>
            </div>

            {/* Coming Soon - Ultra Compact */}
            <div className="bg-gray-1 rounded-lg p-3 text-center">
              <h5 className="text-xs font-medium text-dark mb-1">Additional Payment Options</h5>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs text-gray-500">PayPal • Cryptocurrency • More</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  Coming Soon
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
                  <h3 className="text-lg font-bold text-dark">Recent Transaction Activity</h3>
                  <p className="text-sm text-body">Your latest wallet transactions</p>
                </div>
              </div>
              {recentTransactions.length > 0 && (
                <button
                  onClick={loadRecentTransactions}
                  disabled={isRefreshingTransactions}
                  className="text-blue hover:text-blue-dark text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isRefreshingTransactions ? (
                    <>
                      <svg className="animate-spin h-3 w-3 text-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
              )}
            </div>

            {recentTransactions.length === 0 ? (
              <div className="text-center py-8" role="status" aria-label="No transactions">
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="font-medium text-dark mb-2">No transactions yet</h4>
                <p className="text-body text-sm mb-4">Your wallet transaction history will appear here once you start adding funds or making purchases.</p>
              </div>
            ) : (
              <div className="space-y-3" role="list" aria-label="Recent transactions">
                {recentTransactions.slice(0, 5).map((transaction) => (
                  <article key={transaction.externalId} className="flex items-center gap-3 p-3 rounded-xl bg-gray-1" role="listitem">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'funding' ? 'bg-green-light-5' : 'bg-red-light-5'
                    }`} aria-hidden="true">
                      {transaction.type === 'funding' ? (
                        <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Funds added">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Funds spent">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-semibold text-dark truncate capitalize">
                        {transaction.type === 'funding' ? 'Wallet Funding' : 'Purchase'} - {transaction.description}
                      </h5>
                      <time className="text-xs text-body" dateTime={transaction.createdAt}>
                        {formatDate(transaction.createdAt)}
                      </time>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        transaction.type === 'funding' ? 'text-green' : 'text-red'
                      }`} aria-label={`${transaction.type === 'funding' ? 'Added' : 'Spent'} ${formatCurrency(Math.abs(transaction.amount), transaction.currency)}`}>
                        {transaction.type === 'funding' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security Notice - Bottom */}
        <section className="bg-white rounded-2xl shadow-1 border border-gray-3 p-4 sm:p-6" aria-labelledby="security-heading">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-light-5 rounded-full flex items-center justify-center" aria-hidden="true">
              <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 id="security-heading" className="font-semibold text-dark mb-1">Bank-Level Security & Trust</h3>
              <p className="text-sm text-body">Your funds are protected with industry-standard encryption, PCI DSS compliance, and secure payment processing powered by Stripe. We never store your card details.</p>
            </div>
          </div>
        </section>
      </div>
    </section>
    </>
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
