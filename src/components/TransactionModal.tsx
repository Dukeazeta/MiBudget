import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/appStoreWithDB';
import { TransactionType } from '@mibudget/shared';
import { LoadingSpinner } from './LoadingSpinner';
import { ResponsiveAmount } from './ResponsiveAmount';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
  transactionId?: string;
}

type ModalStep = 'amount' | 'details';

export function TransactionModal({ isOpen, onClose, type, transactionId }: TransactionModalProps) {
  const { transactions, createTransaction, updateTransaction } = useAppStore();
  const [step, setStep] = useState<ModalStep>('amount');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = !!transactionId;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && transactionId) {
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
          setAmount((Math.abs(transaction.amount_cents) / 100).toString());
          setDescription(transaction.description || '');
          setStep('details'); // Go directly to details for editing
        }
      } else {
        // Reset form for new transaction
        setAmount('');
        setDescription('');
        setStep('amount'); // Start with amount step
      }
    }
  }, [isOpen, isEditing, transactionId, transactions]);

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) return;
    setStep('details');
  };

  const handleBack = () => {
    setStep('amount');
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;

    setLoading(true);
    try {
      const amountCents = Math.round(parseFloat(amount) * 100);
      const transactionData = {
        amount_cents: amountCents, // Always store as positive, the type determines if it adds or subtracts
        type,
        description: description || undefined,
        occurred_at: new Date().toISOString(),
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md animate-slide-up">
        
        {/* Step 1: Amount */}
        {step === 'amount' && (
          <div className="p-8 text-center">
            <div className="mb-8">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                type === 'income' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <svg className={`w-8 h-8 ${
                  type === 'income' ? 'text-green-600' : 'text-red-600'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {type === 'income' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  )}
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                How much?
              </h2>
              <p className="text-gray-500">
                {type === 'income' ? 'Money coming in' : 'Money going out'}
              </p>
            </div>

            <form onSubmit={handleAmountSubmit} className="space-y-6">
              <div className="relative px-4">
                {/* Invisible measuring element */}
                <div className="absolute inset-0 pointer-events-none opacity-0 flex items-center justify-center">
                  <ResponsiveAmount
                    amount={amount || '0'}
                    maxSize="4xl"
                    minSize="lg"
                    prefix="$"
                    className="text-center"
                  />
                </div>
                
                {/* Actual input - styled to match the measuring element */}
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl sm:text-3xl md:text-4xl font-bold text-gray-400 pointer-events-none opacity-100">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only numbers and decimal point
                      if (/^\d*\.?\d*$/.test(value)) {
                        setAmount(value);
                      }
                    }}
                    className={`w-full font-bold text-center bg-transparent border-none outline-none text-gray-900 placeholder-gray-300 pl-8 ${
                      amount && amount.length > 8 ? 'text-lg' :
                      amount && amount.length > 6 ? 'text-2xl' :
                      amount && amount.length > 4 ? 'text-3xl' : 'text-4xl'
                    }`}
                    placeholder="0"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 text-gray-600 font-medium transition-colors hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-4 rounded-xl font-bold text-white transition-all transform hover:scale-105 ${
                    amount && parseFloat(amount) > 0
                      ? type === 'income'
                        ? 'bg-green-600 hover:bg-green-700 shadow-lg' 
                        : 'bg-red-600 hover:bg-red-700 shadow-lg'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  disabled={!amount || parseFloat(amount) <= 0}
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <div className="p-8">
            <div className="mb-6">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              
              <div className="text-center mb-6">
                <div className="px-4">
                  <ResponsiveAmount
                    amount={parseFloat(amount || '0').toFixed(2)}
                    maxSize="3xl"
                    minSize="lg"
                    prefix="$"
                    color={type === 'income' ? 'text-green-600' : 'text-red-600'}
                    className="text-center mb-2"
                  />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {type === 'income' ? 'From where?' : 'For what?'}
                </h2>
              </div>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-6 text-2xl text-center border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
                  placeholder={type === 'income' ? 'Salary, freelance, gift...' : 'Groceries, coffee, gas...'}
                  autoFocus
                />
                <p className="text-sm text-gray-500 text-center mt-3">
                  {type === 'income' ? 'Where did this money come from?' : 'What did you spend money on?'}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 text-gray-600 font-medium transition-colors hover:text-gray-800"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-4 rounded-xl font-bold text-white transition-all transform hover:scale-105 ${
                    type === 'income'
                      ? 'bg-green-600 hover:bg-green-700 shadow-lg'
                      : 'bg-red-600 hover:bg-red-700 shadow-lg'
                  }`}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </div>
                  ) : (
                    `${isEditing ? 'Update' : 'Add'} ${type === 'income' ? 'Income' : 'Expense'}`
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
