import React from 'react';

interface PaymentMethodsProps {}

const PaymentMethods: React.FC<PaymentMethodsProps> = () => {
  return (
    <div className="bg-white rounded-2xl shadow-1 border border-gray-3 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-10">
      <div className="flex items-center mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-light-5 rounded-full flex items-center justify-center mr-3">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-dark">Payment Methods</h3>
          <p className="text-xs sm:text-sm text-body">Choose your preferred way to add funds</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {/* Credit/Debit Card (Stripe) - Active */}
        <div className="rounded-xl border-2 border-blue-light-4 bg-blue-light-5/30 p-4 sm:p-6 relative">
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue text-white">
              Available
            </span>
          </div>
          
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-light-4 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-base sm:text-lg font-semibold text-dark mb-1">Credit/Debit Card</h4>
              <p className="text-xs sm:text-sm text-body mb-2">
                Secure, instant processing with Stripe
              </p>
              <div className="flex items-center gap-1 text-xs text-body">
                <svg className="w-3 h-3 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Instant • 2.9% + $0.30 fee</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <div className="px-2 py-1 bg-white rounded-md border border-gray-300 text-xs font-medium text-dark">
              Visa
            </div>
            <div className="px-2 py-1 bg-white rounded-md border border-gray-300 text-xs font-medium text-dark">
              MC
            </div>
            <div className="px-2 py-1 bg-white rounded-md border border-gray-300 text-xs font-medium text-dark">
              Amex
            </div>
            <div className="px-2 py-1 bg-white rounded-md border border-gray-300 text-xs font-medium text-dark">
              +More
            </div>
          </div>

          <button className="w-full bg-blue text-white font-medium py-2 sm:py-2.5 px-4 rounded-lg hover:bg-blue-dark transition-colors ease-out duration-200 text-sm sm:text-base">
            Use Card Payment
          </button>
        </div>

        {/* Coming Soon Methods - Compact */}
        <div className="rounded-xl border-2 border-gray-light-4 bg-gray-light-6 p-4 sm:p-6 relative">
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              Coming Soon
            </span>
          </div>
          
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-light-4 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-base sm:text-lg font-semibold text-dark mb-1">More Options</h4>
              <p className="text-xs sm:text-sm text-body mb-2">
                PayPal, Crypto, Bank Transfer & more
              </p>
              <div className="flex items-center gap-1 text-xs text-body">
                <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Multiple options launching soon</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <div className="px-2 py-1 bg-white rounded-md border border-gray-300 text-xs font-medium text-dark">
              PayPal
            </div>
            <div className="px-2 py-1 bg-white rounded-md border border-gray-300 text-xs font-medium text-dark">
              BTC
            </div>
            <div className="px-2 py-1 bg-white rounded-md border border-gray-300 text-xs font-medium text-dark">
              Bank
            </div>
            <div className="px-2 py-1 bg-white rounded-md border border-gray-300 text-xs font-medium text-dark">
              +More
            </div>
          </div>

          <button 
            disabled 
            className="w-full bg-gray-300 text-gray-500 font-medium py-2 sm:py-2.5 px-4 rounded-lg cursor-not-allowed text-sm sm:text-base"
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods;