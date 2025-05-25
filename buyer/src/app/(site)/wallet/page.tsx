'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { walletApi, WalletData, TransactionData } from '@/services/wallet';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

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
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

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
      setPaymentError('Stripe not loaded');
      return;
    }

    if (fundingAmount < 5 || fundingAmount > 1000) {
      setPaymentError('Amount must be between $5 and $1000');
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentSuccess(null);

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
          setPaymentSuccess(`Successfully added $${fundingAmount} to your wallet!`);
          setFundingAmount(50); // Reset amount
          loadWalletData(); // Reload wallet data
        } else {
          throw new Error(confirmResponse.message);
        }
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment failed');
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadWalletData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-gray-600 mt-2">Manage your funds and view transaction history</p>
        </div>

        {/* Wallet Balance Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Current Balance</h2>
              <p className="text-4xl font-bold text-blue-600">
                {wallet ? formatCurrency(wallet.balance, wallet.currency) : '$0.00'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Total Funded</div>
              <div className="text-lg font-semibold text-green-600">
                {wallet ? formatCurrency(wallet.totalFunded, wallet.currency) : '$0.00'}
              </div>
              <div className="text-sm text-gray-500 mb-1 mt-2">Total Spent</div>
              <div className="text-lg font-semibold text-red-600">
                {wallet ? formatCurrency(wallet.totalSpent, wallet.currency) : '$0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Fund Wallet Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Add Funds</h3>
          
          {paymentError && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {paymentError}
            </div>
          )}
          
          {paymentSuccess && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {paymentSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                min="5"
                max="1000"
                value={fundingAmount}
                onChange={(e) => setFundingAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount"
              />
              <p className="text-sm text-gray-500 mt-1">Minimum: $5, Maximum: $1000</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="border border-gray-300 rounded-md p-3">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleFundWallet}
            disabled={isProcessingPayment || !stripe || !elements}
            className="mt-6 w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingPayment ? 'Processing...' : `Add ${formatCurrency(fundingAmount)}`}
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          
          {recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.externalId} className="border-b border-gray-100">
                      <td className="py-3 px-4 capitalize">{transaction.type}</td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(transaction.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {transaction.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WalletPage: React.FC<WalletPageProps> = () => {
  const { token } = useSelector((state: any) => state.authReducer);
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    if (!token) {
      router.push('/signin?redirect=/wallet');
      return;
    }
  }, [token, router]);

  // Don't render if not authenticated
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <WalletContent />
    </Elements>
  );
};

export default WalletPage;
