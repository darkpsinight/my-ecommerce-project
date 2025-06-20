import React from 'react';

interface Transaction {
  id: string;
  type: 'purchase' | 'refund' | 'deposit';
  title: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

const QuickTransactions: React.FC = () => {
  // Mock transaction data
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'purchase',
      title: 'Steam Gift Card $50',
      amount: -50.00,
      date: '2 hours ago',
      status: 'completed'
    },
    {
      id: '2',
      type: 'deposit',
      title: 'Card Deposit',
      amount: 100.00,
      date: '1 day ago',
      status: 'completed'
    },
    {
      id: '3',
      type: 'purchase',
      title: 'PlayStation Store $25',
      amount: -25.00,
      date: '2 days ago',
      status: 'completed'
    },
    {
      id: '4',
      type: 'refund',
      title: 'Order Refund #12345',
      amount: 35.99,
      date: '3 days ago',
      status: 'completed'
    },
    {
      id: '5',
      type: 'purchase',
      title: 'Xbox Game Pass',
      amount: -14.99,
      date: '5 days ago',
      status: 'completed'
    }
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return (
          <div className="w-10 h-10 bg-red-light-5 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 9a2 2 0 01-2 2H8a2 2 0 01-2-2L5 9z" />
            </svg>
          </div>
        );
      case 'deposit':
        return (
          <div className="w-10 h-10 bg-green-light-5 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'refund':
        return (
          <div className="w-10 h-10 bg-blue-light-5 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-light-5 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-1 border border-gray-3 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-light-6 to-gray-light-5 px-6 py-5 border-b border-gray-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-light-5 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-dark">Recent Activity</h3>
              <p className="text-sm text-body">Last 7 days</p>
            </div>
          </div>
          <button className="text-blue hover:text-blue-dark text-sm font-medium">
            View All
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="p-6">
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-light-6 hover:bg-gray-light-5 transition-colors duration-200">
              {getTransactionIcon(transaction.type)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark truncate">
                  {transaction.title}
                </p>
                <p className="text-xs text-body">
                  {transaction.date}
                </p>
              </div>
              
              <div className="text-right">
                <p className={`text-sm font-bold ${
                  transaction.amount > 0 ? 'text-green' : 'text-red'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </p>
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  transaction.status === 'completed' 
                    ? 'bg-green-light-5 text-green' 
                    : transaction.status === 'pending'
                    ? 'bg-yellow-light-5 text-yellow'
                    : 'bg-red-light-5 text-red'
                }`}>
                  {transaction.status === 'completed' && (
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-gray-3">
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 p-3 bg-blue-light-5 hover:bg-blue-light-4 text-blue rounded-xl transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium">Full History</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-3 bg-green-light-5 hover:bg-green-light-4 text-green rounded-xl transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickTransactions;