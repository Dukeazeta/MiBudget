import { useState } from 'react';
import { Transaction, Category } from '@mibudget/shared';
import { TransactionListItem } from './TransactionListItem';
import { TransactionModal } from './TransactionModal';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  showPendingBadges?: boolean;
  limit?: number;
  className?: string;
}

interface GroupedTransactions {
  [date: string]: Transaction[];
}

export function TransactionList({ 
  transactions, 
  categories, 
  showPendingBadges = false,
  limit,
  className = ''
}: TransactionListProps) {
  const [editingTransaction, setEditingTransaction] = useState<{
    id: string;
    type: 'income' | 'expense';
  } | null>(null);

  // Group transactions by date
  const groupedTransactions = transactions
    .slice(0, limit) // Apply limit if provided
    .reduce<GroupedTransactions>((groups, transaction) => {
      const date = new Date(transaction.occurred_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {});

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const handleEdit = (transactionId: string, type: 'income' | 'expense') => {
    setEditingTransaction({ id: transactionId, type });
  };

  const handleCloseModal = () => {
    setEditingTransaction(null);
  };

  const getCategoryById = (categoryId: string | null | undefined) => {
    return categoryId ? categories.find(c => c.id === categoryId) : undefined;
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

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
                {formatDateHeader(date)}
              </h3>
            </div>

            {/* Transactions for this date */}
            {groupedTransactions[date]
              .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
              .map((transaction) => (
                <TransactionListItem
                  key={transaction.id}
                  transaction={transaction}
                  category={getCategoryById(transaction.category_id)}
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