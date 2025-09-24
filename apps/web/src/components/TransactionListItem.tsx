import { useState } from 'react';
import { Transaction, Category } from '@mibudget/shared';
import { useAppStore } from '../stores/appStoreWithDB';

interface TransactionListItemProps {
  transaction: Transaction;
  category?: Category;
  onEdit: (transactionId: string, type: 'income' | 'expense') => void;
  showPendingBadge?: boolean;
}

export function TransactionListItem({ 
  transaction, 
  category, 
  onEdit, 
  showPendingBadge = false 
}: TransactionListItemProps) {
  const { deleteTransaction } = useAppStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isIncome = transaction.amount_cents > 0;
  const amount = Math.abs(transaction.amount_cents) / 100;
  const date = new Date(transaction.occurred_at).toLocaleDateString();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTransaction(transaction.id);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      // TODO: Show error toast
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    onEdit(transaction.id, isIncome ? 'income' : 'expense');
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4 flex-1">
        {/* Amount */}
        <div className="flex-shrink-0">
          <div className={`text-lg font-semibold ${
            isIncome ? 'text-green-600' : 'text-red-600'
          }`}>
            {isIncome ? '+' : '-'}${amount.toFixed(2)}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {transaction.description || 'No description'}
            </p>
            {showPendingBadge && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pending
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-sm text-gray-500">{date}</p>
            {category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {category.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={handleEdit}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Edit transaction"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          title="Delete transaction"
          disabled={isDeleting}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Transaction
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}