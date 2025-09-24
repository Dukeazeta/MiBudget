import React, { useState } from 'react';
import { useAppStore } from '../stores/appStoreWithDB';
import { useSettingsStore } from '../stores/settingsStore';
import { TransactionModal } from '../components/TransactionModal';
import { TransactionList } from '../components/TransactionList';
import { Logo } from '../components/Logo';
import { ResponsiveAmount } from '../components/ResponsiveAmount';
import { ResponsiveBalance } from '../components/ResponsiveBalance';
import { formatMoney, getNextRevealDay, DAYS_OF_WEEK, TransactionType } from '@mibudget/shared';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { balance, transactions, categories, isOnline, isSyncing, lastSync, createTransaction, updateTransaction, deleteTransaction } = useAppStore();
  const { settings, isBalanceVisible } = useSettingsStore();
  const [transactionModal, setTransactionModal] = useState<{isOpen: boolean, type: TransactionType} | null>(null);
  
  if (!settings) return null;

  const nextRevealDate = getNextRevealDay(settings.reveal_day, settings.timezone);
  const revealDayName = DAYS_OF_WEEK[settings.reveal_day];

  const recentTransactions = transactions
    .filter(t => !t.deleted)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 safe-area-top">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Logo size="md" />
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isSyncing ? 'bg-yellow-400 animate-pulse' : 
                  isOnline ? 'bg-green-400' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-gray-500">
                  {isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <Link 
              to="/settings" 
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Settings"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="min-h-screen flex flex-col">
        {/* Massive Balance Card - Takes up ~50% of screen */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="text-center w-full">
            {isBalanceVisible ? (
              <div className="animate-fade-in">
                <div className="px-4 mb-4">
                  <ResponsiveBalance
                    amount={balance}
                    color="text-gray-900"
                    className="text-center"
                  />
                </div>
                <p className="text-lg text-gray-500 font-medium">
                  Current Balance
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Visible on {revealDayName}s
                </p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="text-7xl md:text-8xl font-black text-gray-300 mb-4 leading-none tracking-widest">
                  ••••••
                </div>
                <p className="text-lg text-gray-500 font-medium">
                  Balance Hidden
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Reveals on {revealDayName}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Next: {format(nextRevealDate, 'MMM d')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Action Buttons & Recent Transactions */}
        <div className="flex-1 bg-white px-4 py-6 space-y-6">
          {/* Large Action Buttons - Optimized for mobile */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setTransactionModal({isOpen: true, type: 'income'})}
              className="group relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl shadow-lg transition-all duration-200 transform active:scale-95"
            >
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="font-bold text-lg">Income</span>
            </button>

            <button 
              onClick={() => setTransactionModal({isOpen: true, type: 'expense'})}
              className="group relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl shadow-lg transition-all duration-200 transform active:scale-95"
            >
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                </svg>
              </div>
              <span className="font-bold text-lg">Expense</span>
            </button>
          </div>

          {/* Recent Transactions - Hint only */}
          {recentTransactions.length > 0 ? (
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">Recent</h3>
                <Link 
                  to="/transactions" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                  <span>View All</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              {/* Show only first 3 transactions as a hint */}
              <div className="space-y-2">
                {recentTransactions.slice(0, 3).map((transaction) => {
                  const isIncome = transaction.type === 'income' || transaction.type === 'adjustment';
                  const amount = transaction.amount_cents / 100;
                  
                  return (
                    <div key={transaction.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isIncome ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <svg className={`w-4 h-4 ${
                            isIncome ? 'text-green-600' : 'text-red-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isIncome ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            )}
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.description || 'Transaction'}
                          </p>
                        </div>
                      </div>
                      <div className="min-w-0 max-w-[80px]">
                        <ResponsiveAmount
                          amount={amount.toFixed(2)}
                          maxSize="sm"
                          minSize="xs"
                          prefix={isIncome ? '+$' : '-$'}
                          color={isIncome ? 'text-green-600' : 'text-red-600'}
                          className="text-right"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">No transactions yet</h3>
              <p className="text-xs text-gray-500">Tap the buttons above to get started</p>
            </div>
          )}
        </div>

        {/* Bottom spacing */}
        <div className="h-4 safe-area-bottom" />
      </main>

      {/* Transaction Modal */}
      {transactionModal && (
        <TransactionModal
          isOpen={transactionModal.isOpen}
          onClose={() => setTransactionModal(null)}
          type={transactionModal.type}
        />
      )}
    </div>
  );
}