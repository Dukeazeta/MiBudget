import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStoreWithDB';
import { TransactionType } from '@mibudget/shared';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
  transactionId?: string;
}

export function TransactionModal({ isOpen, onClose, type, transactionId }: TransactionModalProps) {
  const { transactions, categories, createTransaction, updateTransaction } = useAppStore();
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const isEditing = !!transactionId;
  const title = isEditing 
    ? `Edit ${type === 'income' ? 'Income' : 'Expense'}` 
    : `Add ${type === 'income' ? 'Income' : 'Expense'}`;

  useEffect(() => {
    if (isEditing && transactionId) {
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        setAmount((Math.abs(transaction.amount_cents) / 100).toString());
        setCategoryId(transaction.category_id || '');
        setDescription(transaction.description || '');
        setDate(transaction.occurred_at.split('T')[0]);
      }
    } else {
      // Reset form for new transaction
      setAmount('');
      setCategoryId('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, isEditing, transactionId, transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    setLoading(true);
    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      const transactionData = {
        amount_cents: type === 'income' ? amountCents : -amountCents,
        type,
        category_id: categoryId || undefined,
        description: description || undefined,
        occurred_at: new Date(date + 'T12:00:00.000Z').toISOString(),
      };

      if (isEditing && transactionId) {
        await updateTransaction(transactionId, transactionData);
      } else {
        await createTransaction(transactionData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional description"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex-1 px-4 py-2 rounded-md text-white focus:ring-2 focus:ring-offset-2 transition-colors ${
                  type === 'income'
                    ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                }`}
                disabled={loading || !amount}
              >
                {loading ? 'Saving...' : (isEditing ? 'Update' : 'Add')} {type === 'income' ? 'Income' : 'Expense'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}