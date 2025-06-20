import React, { useState } from 'react';

const AddFundsSection: React.FC = () => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  const quickAmounts = [10, 25, 50, 100, 250, 500];

  const handleQuickAmount = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-1 border border-gray-3 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-light-5 to-indigo-light-5 px-6 sm:px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-light-4 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-dark">Add Funds</h3>
            <p className="text-sm sm:text-base text-body">Choose amount and payment method</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* Quick Amount Selection */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-dark mb-4">Quick Select</h4>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickAmount(amount)}
                className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                  selectedAmount === amount
                    ? 'border-blue bg-blue text-white shadow-md'
                    : 'border-gray-3 bg-gray-1 text-dark hover:border-blue-light-4 hover:bg-blue-light-5'
                }`}
              >
                <div className="text-sm sm:text-base font-semibold">${amount}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-dark mb-4">Custom Amount</h4>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-500 text-lg font-medium">$</span>
            </div>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-4 border-2 border-gray-3 rounded-xl focus:border-blue focus:ring-2 focus:ring-blue-light-5 outline-none transition-all duration-200 text-lg font-medium"
              placeholder="Enter amount"
              min="5"
            />
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h4 className="text-lg font-semibold text-dark mb-6">Payment Methods</h4>
          
          {/* Active Payment Method - Credit/Debit Card */}
          <div className="mb-4">
            <div className="rounded-xl border-2 border-blue-light-4 bg-blue-light-5/30 p-4 sm:p-6 relative">
              <div className="absolute top-4 right-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue text-white">
                  Available
                </span>
              </div>
              
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-light-4 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h5 className="text-lg font-semibold text-dark mb-2">Credit/Debit Card</h5>
                  <p className="text-sm text-body mb-3">
                    Secure payments with instant processing. Industry-standard encryption protects your data.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-body">
                    <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secured by Stripe • Instant processing • 2.9% + $0.30 fee</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-3 text-xs font-medium text-dark flex items-center gap-1">
                  <div className="w-4 h-2.5 bg-blue-600 rounded-sm"></div>
                  Visa
                </div>
                <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-3 text-xs font-medium text-dark flex items-center gap-1">
                  <div className="w-4 h-2.5 bg-red-600 rounded-sm"></div>
                  Mastercard
                </div>
                <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-3 text-xs font-medium text-dark flex items-center gap-1">
                  <div className="w-4 h-2.5 bg-blue-500 rounded-sm"></div>
                  Amex
                </div>
                <div className="px-3 py-1.5 bg-white rounded-lg border border-gray-3 text-xs font-medium text-dark">
                  +More
                </div>
              </div>

              <button 
                disabled={!selectedAmount && !customAmount}
                className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-200 ${
                  selectedAmount || customAmount
                    ? 'bg-blue text-white hover:bg-blue-dark shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add ${selectedAmount || customAmount || '0'} with Card
              </button>
            </div>
          </div>

          {/* Coming Soon - Compact Display */}
          <div className="bg-gray-light-6 rounded-xl p-4 border border-gray-light-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-light-4 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark">More Payment Options</p>
                  <p className="text-xs text-body">PayPal, Crypto, Bank Transfer</p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFundsSection;