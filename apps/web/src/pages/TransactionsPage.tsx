import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../stores/appStoreWithDB';
import { useSettingsStore } from '../stores/settingsStore';
import { TransactionModal } from '../components/TransactionModal';
import { TransactionList } from '../components/TransactionList';
import { Logo } from '../components/Logo';
import { TransactionType } from '@mibudget/shared';

export function TransactionsPage() {
  const { transactions, categories, isOnline, isSyncing } = useAppStore();
  const { settings } = useSettingsStore();
  const [transactionModal, setTransactionModal] = useState<{isOpen: boolean, type: TransactionType} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionType, setTransactionType] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(transaction => !transaction.deleted)
      .filter(transaction => {
        // Search query filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const description = (transaction.description || '').toLowerCase();
          const amount = (Math.abs(transaction.amount_cents) / 100).toString();
          return description.includes(query) || amount.includes(query);
        }
        return true;
      })
      .filter(transaction => {
        // Transaction type filter
        if (transactionType === 'income') {
          return transaction.amount_cents > 0;
        } else if (transactionType === 'expense') {
          return transaction.amount_cents < 0;
        }
        return true;
      })
      .filter(transaction => {
        // Date range filter
        const transactionDate = new Date(transaction.occurred_at).toISOString().split('T')[0];
        
        if (dateRange.from && transactionDate < dateRange.from) {
          return false;
        }
        if (dateRange.to && transactionDate > dateRange.to) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }, [transactions, searchQuery, transactionType, dateRange]);

  const clearFilters = () => {
    setSearchQuery('');
    setTransactionType('');
    setDateRange({ from: '', to: '' });
  };

  const hasActiveFilters = searchQuery || transactionType || dateRange.from || dateRange.to;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex items-center space-x-3">
                <Logo size="sm" />
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    isSyncing ? 'bg-yellow-400 animate-pulse' : 
                    isOnline ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm text-gray-500">
                    {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Add Transaction Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setTransactionModal({isOpen: true, type: 'income'})}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Add Income"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button
                onClick={() => setTransactionModal({isOpen: true, type: 'expense'})}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Add Expense"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <Link
                to="/settings"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                id="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search descriptions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type-filter"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {/* Date Range - From */}
            <div>
              <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                id="date-from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Date Range - To and Clear Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                id="date-to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <TransactionList 
          transactions={filteredTransactions}
          showPendingBadges={false}
        />

        {/* Empty State */}
        {filteredTransactions.length === 0 && transactions.length > 0 && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions match your filters</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or clear all filters.</p>
          </div>
        )}
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