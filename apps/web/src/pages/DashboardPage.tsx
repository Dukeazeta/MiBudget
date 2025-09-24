import React, { useState } from 'react';
import { useAppStore } from '../stores/appStoreWithDB';
import { useSettingsStore } from '../stores/settingsStore';
import { TransactionModal } from '../components/TransactionModal';
import { TransactionList } from '../components/TransactionList';
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
            <div>
              <h1 className="text-lg font-semibold text-gray-900">MiBudget</h1>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isSyncing ? 'bg-yellow-400 animate-pulse' : 
                  isOnline ? 'bg-green-400' : 'bg-gray-400'
                }`} />
                <span className="text-sm text-gray-500">
                  {isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Balance Card */}
        <div className="card mb-8">
          <div className="text-center">
            <h2 className="text-sm font-medium text-gray-500 mb-4">Current Balance</h2>
            
            {isBalanceVisible ? (
              <div className="animate-fade-in">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {formatMoney(balance, settings.currency_code)}
                </div>
                <p className="text-sm text-gray-600">
                  Balance visible on {revealDayName}s
                </p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="balance-hidden text-gray-400 mb-2">
                  ••••••
                </div>
                <div className="text-sm text-gray-600">
                  <p>Balance hidden until {revealDayName}</p>
                  <p className="text-xs mt-1">
                    Next reveal: {format(nextRevealDate, 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button 
            onClick={() => setTransactionModal({isOpen: true, type: 'income'})}
            className="flex flex-col items-center justify-center p-6 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-sm transition-all duration-200 active:scale-95"
          >
            <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="font-medium">Income</span>
            <span className="text-xs text-green-200">Add money</span>
          </button>

          <button 
            onClick={() => setTransactionModal({isOpen: true, type: 'expense'})}
            className="flex flex-col items-center justify-center p-6 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all duration-200 active:scale-95"
          >
            <div className="w-12 h-12 bg-red-400 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </div>
            <span className="font-medium">Expense</span>
            <span className="text-xs text-red-200">Track spending</span>
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            {recentTransactions.length > 0 && (
              <Link 
                to="/transactions" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </Link>
            )}
          </div>
          
          <TransactionList 
            transactions={recentTransactions}
            categories={categories}
            showPendingBadges={true}
            limit={5}
            className="border-none rounded-none shadow-none"
          />
        </div>

        {/* Bottom spacing for mobile navigation */}
        <div className="h-20 safe-area-bottom" />
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