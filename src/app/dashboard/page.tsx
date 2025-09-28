'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/appStoreWithDB';
import { useSettingsStore } from '@/stores/settingsStore';
import { TransactionModal } from '@/components/TransactionModal';
import { TransactionList } from '@/components/TransactionList';
import { Logo } from '@/components/Logo';
import { ResponsiveAmount } from '@/components/ResponsiveAmount';
import { ResponsiveBalance } from '@/components/ResponsiveBalance';
import { AppInitializer } from '@/components/AppInitializer';
import { formatMoney, getCurrencySymbol } from '@/lib/utils';
import { getNextRevealDay, DAYS_OF_WEEK } from '@/lib/dateUtils';
import { TransactionType } from '@/lib/types';
import { format } from 'date-fns';
import Link from 'next/link';

function DashboardContent() {
  const { balance, transactions, categories, isOnline, isSyncing, lastSync, createTransaction, updateTransaction, deleteTransaction } = useAppStore();
  const { settings, isBalanceVisible } = useSettingsStore();
  const [transactionModal, setTransactionModal] = useState<{isOpen: boolean, type: TransactionType} | null>(null);
  
  // At this point settings should exist due to AppInitializer
  if (!settings) {
    return <div>No settings found</div>;
  }

  const nextRevealDate = getNextRevealDay(settings.reveal_day, settings.timezone);
  const revealDayName = DAYS_OF_WEEK[settings.reveal_day];
  const currencySymbol = getCurrencySymbol(settings.currency_code);

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
              href="/settings" 
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
        {/* Balance Section - Clean and Bold */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
          <div className="text-center w-full max-w-sm">
            {isBalanceVisible ? (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <ResponsiveBalance
                    amount={balance}
                    currencySymbol={currencySymbol}
                    color="text-gray-900"
                    className="text-center balance-visible"
                  />
                </div>
                <p className="text-xl font-bold text-gray-900 mb-2">
                  Current Balance
                </p>
                <p className="text-sm text-gray-500">
                  Visible on {revealDayName}s
                </p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div className="balance-hidden mb-6">
                  ••••••
                </div>
                <p className="text-xl font-bold text-gray-900 mb-2">
                  Balance Hidden
                </p>
                <p className="text-sm text-gray-500 mb-1">
                  Reveals on {revealDayName}
                </p>
                <p className="text-xs text-gray-400">
                  Next: {format(nextRevealDate, 'MMM d')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Action Buttons & Recent Transactions */}
        <div className="flex-1 bg-gray-50 px-6 py-8 space-y-8">
          {/* Bold Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setTransactionModal({isOpen: true, type: 'income'})}
              className="flex flex-col items-center justify-center p-8 bg-green-600 hover:bg-green-700 text-white rounded-2xl transition-all duration-200 transform active:scale-95 shadow-sm"
            >
              <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="font-bold text-lg">Add Income</span>
            </button>

            <button 
              onClick={() => setTransactionModal({isOpen: true, type: 'expense'})}
              className="flex flex-col items-center justify-center p-8 bg-red-600 hover:bg-red-700 text-white rounded-2xl transition-all duration-200 transform active:scale-95 shadow-sm"
            >
              <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                </svg>
              </div>
              <span className="font-bold text-lg">Add Expense</span>
            </button>
          </div>

          {/* Recent Transactions */}
          {recentTransactions.length > 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                <Link 
                  href="/transactions" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1"
                >
                  <span>View All</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentTransactions.slice(0, 3).map((transaction) => {
                  const isIncome = transaction.type === 'income' || transaction.type === 'adjustment';
                  const amount = transaction.amount_cents / 100;
                  
                  return (
                    <div key={transaction.id} className="transaction-item">
                      <div className="flex items-center space-x-3">
                        <div className={`transaction-icon ${
                          isIncome ? 'transaction-icon--income' : 'transaction-icon--expense'
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isIncome ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            )}
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.description || 'Transaction'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <ResponsiveAmount
                          amount={amount.toFixed(2)}
                          maxSize="sm"
                          minSize="xs"
                          prefix={isIncome ? `+${currencySymbol}` : `-${currencySymbol}`}
                          color={isIncome ? 'text-green-600' : 'text-red-600'}
                          className="text-right font-bold"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-500">Use the buttons above to start tracking</p>
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

export default function Page() {
  return (
    <AppInitializer>
      <DashboardContent />
    </AppInitializer>
  );
}
