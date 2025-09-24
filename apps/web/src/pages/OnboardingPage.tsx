import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStoreWithDB';
import { DAYS_OF_WEEK, generateId, now, formatMoney, parseMoney } from '@mibudget/shared';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { updateSettings } = useSettingsStore();
  const { createTransaction } = useAppStore();
  
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [revealDay, setRevealDay] = useState(6); // Saturday
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const balanceCents = parseMoney(balance);
      const timestamp = now();
      
      // Create settings
      const settings = {
        id: 'default',
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        currency_code: currency,
        reveal_day: revealDay,
        hide_balance: true,
        initial_balance_cents: balanceCents,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      
      // Create initial balance transaction for traceability
      const initialTransaction = {
        id: generateId(),
        created_at: timestamp,
        updated_at: timestamp,
        deleted: false,
        amount_cents: balanceCents,
        type: 'adjustment' as const,
        description: 'Initial balance',
        occurred_at: new Date().toISOString(),
      };

      // Save settings and transaction
      await updateSettings({
        currency_code: currency,
        reveal_day: revealDay,
        hide_balance: true,
        initial_balance_cents: balanceCents,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      
      await createTransaction(initialTransaction);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error setting up account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to MiBudget</h1>
          <p className="text-gray-600 text-balance">Let's get started by setting up your current balance</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-gray-700 mb-2">
                Current Balance
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">{currency === 'USD' ? '$' : currency}</span>
                </div>
                <input
                  type="text"
                  id="balance"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="input pl-8"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter your current total balance across all accounts</p>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>

            <div>
              <label htmlFor="revealDay" className="block text-sm font-medium text-gray-700 mb-2">
                Balance Reveal Day
              </label>
              <select
                id="revealDay"
                value={revealDay}
                onChange={(e) => setRevealDay(Number(e.target.value))}
                className="input"
              >
                {DAYS_OF_WEEK.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Your balance will only be visible on this day each week
              </p>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-primary-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm">
                  <p className="text-primary-800 font-medium">Privacy by Design</p>
                  <p className="text-primary-700 mt-1">
                    Your balance will be hidden most of the time to help reduce financial anxiety. 
                    You can always check your spending through individual transactions.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!balance.trim() || isLoading}
              className="btn btn-primary btn-lg w-full"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                  </svg>
                  Setting up...
                </div>
              ) : (
                'Get Started'
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            This app works offline-first. Your data is stored locally and synced when you're online.
          </p>
        </div>
      </div>
    </div>
  );
}