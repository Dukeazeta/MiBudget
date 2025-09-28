'use client';

import { useState } from 'react';
import { Transaction } from '@/lib/types';
import { TransactionListItem } from './TransactionListItem';
import { TransactionModal } from './TransactionModal';
import { formatDate } from '@/lib/dateUtils';

interface TransactionListProps {
  transactions: Transaction[];
  showPendingBadges?: boolean;
  limit?: number;
  className?: string;
}

interface GroupedTransactions {
  [date: string]: Transaction[];
}

export function TransactionList({ 
  transactions, 
  showPendingBadges = false,
  limit,
  className = ''
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<{
    id: string;
    type: 'income' | 'expense';
  } | null>(null);

  // Group transactions by date with error handling
  const groupedTransactions = transactions
    .slice(0, limit) // Apply limit if provided
    .reduce<GroupedTransactions>((groups, transaction) => {
      try {
        const dateObj = new Date(transaction.occurred_at);
        // Check if the date is valid
        if (isNaN(dateObj.getTime())) {
          console.warn('Invalid date in transaction:', transaction.id, transaction.occurred_at);
          return groups; // Skip this transaction
        }
        
        const date = dateObj.toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
      } catch (error) {
        console.warn('Failed to process transaction date:', transaction.id, error);
        return groups; // Skip this transaction
      }
    }, {});

  // Sort dates in descending order (most recent first) with error handling
  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => {
      try {
        const dateA = new Date(a).getTime();
        const dateB = new Date(b).getTime();
        
        // Check for invalid dates
        if (isNaN(dateA) || isNaN(dateB)) {
          console.warn('Invalid date encountered during sorting:', { a, b });
          return 0; // Keep original order for invalid dates
        }
        
        return dateB - dateA;
      } catch (error) {
        console.warn('Error sorting dates:', error);
        return 0;
      }
    }
  );

  const handleEdit = (transactionId: string, type: 'income' | 'expense') => {
    setEditingTransaction({ id: transactionId, type });
  };

  const handleCloseModal = () => {
    setEditingTransaction(null);
  };


  // Use the improved date formatting utility

  if (transactions.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding your first transaction.</p>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        {sortedDates.map((date) => (
          <div key={date}>
            {/* Date Header */}
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">
                {formatDate.header(date)}
              </h3>
            </div>

            {/* Transactions for this date */}
            {groupedTransactions[date]
              .sort((a, b) => {
                try {
                  const dateA = new Date(a.occurred_at).getTime();
                  const dateB = new Date(b.occurred_at).getTime();
                  
                  // Check for invalid dates
                  if (isNaN(dateA) || isNaN(dateB)) {
                    console.warn('Invalid transaction date for sorting:', { a: a.occurred_at, b: b.occurred_at });
                    return 0; // Keep original order
                  }
                  
                  return dateB - dateA;
                } catch (error) {
                  console.warn('Error sorting transactions:', error);
                  return 0;
                }
              })
              .map((transaction) => (
                <TransactionListItem
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={handleEdit}
                  showPendingBadge={showPendingBadges}
                />
              ))
            }
          </div>
        ))}
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionModal
          isOpen={true}
          onClose={handleCloseModal}
          type={editingTransaction.type}
          transactionId={editingTransaction.id}
        />
      )}
    </>
  );
}