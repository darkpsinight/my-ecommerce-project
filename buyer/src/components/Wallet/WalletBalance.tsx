import React from 'react';

interface WalletBalanceProps {
  balance: number;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({ balance }) => {
  return (
    <div className="relative">
      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-blue via-blue-dark to-indigo-700 rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-3 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-2 border-white/20"></div>
          <div className="absolute top-8 right-8 w-24 h-24 rounded-full border border-white/10"></div>
          <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full border border-white/10"></div>
        </div>

        <div className="relative z-10">
          {/* Balance Display */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
              </div>
              <div>
                <p className="text-white/80 text-sm sm:text-base font-medium">Available Balance</p>
                <p className="text-xs sm:text-sm text-white/60">Updated just now</p>
              </div>
            </div>

            {/* Main Balance */}
            <div className="mb-6">
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2">
                ${balance.toFixed(2)}
              </div>
              <p className="text-white/80 text-sm sm:text-base">USD Balance</p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Funds</span>
              </button>
              <button className="flex-1 bg-white text-blue hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>History</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-1 border border-gray-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-light-5 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-body font-medium">This Month</p>
              <p className="text-lg sm:text-xl font-bold text-dark">$847.30</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-1 border border-gray-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-light-5 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-body font-medium">Total Spent</p>
              <p className="text-lg sm:text-xl font-bold text-dark">$2,156.90</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-1 border border-gray-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-light-5 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 9a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-body font-medium">Purchases</p>
              <p className="text-lg sm:text-xl font-bold text-dark">47</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-1 border border-gray-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-light-5 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-body font-medium">Savings</p>
              <p className="text-lg sm:text-xl font-bold text-dark">$89.45</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletBalance;