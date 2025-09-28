'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStoreWithDB';
import { Logo } from '@/components/Logo';
import { DAYS_OF_WEEK, parseMoney, getCurrencySymbol } from '@/lib/utils';

export default function Page() {
  const router = useRouter();
  const { updateSettings } = useSettingsStore();
  
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [revealDay, setRevealDay] = useState(6); // Saturday
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const balanceCents = parseMoney(balance);
      
      // Save settings (initial balance will be used in balance calculation)
      await updateSettings({
        currency_code: currency,
        reveal_day: revealDay,
        hide_balance: true,
        initial_balance_cents: balanceCents,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      
      // Note: We don't create an adjustment transaction here because
      // the initial_balance_cents in settings is already used in balance calculation.
      // Creating a transaction would double-count the initial balance.

      // Navigate to dashboard
      router.push('/');
    } catch (error) {
      console.error('Error setting up account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center px-6 py-16 max-w-lg mx-auto w-full">
        {/* Logo and Brand */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <Logo size="xl" className="w-20 h-20 mx-auto" />
          </div>
          <h1 className="text-6xl font-black text-gray-900 mb-4 leading-none">
            Mi<span className="text-blue-600">Budget</span>
          </h1>
          <p className="text-xl font-medium text-gray-600 leading-relaxed">
            Simple. Private. Powerful.
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Balance Input */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              What's your current balance?
            </h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none">
                <span className="text-gray-400 text-2xl font-medium">{getCurrencySymbol(currency)}</span>
              </div>
              <input
                type="text"
                id="balance"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full pl-14 pr-6 py-4 text-3xl font-bold text-center bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-600 focus:bg-white outline-none transition-all"
                required
                autoFocus
              />
            </div>
            <div className="mt-4 flex justify-center">
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-700 focus:bg-white focus:border-blue-600 outline-none transition-all"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="NGN">NGN (₦)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM13 10V9a1 1 0 00-1-1h-1a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Choose your reveal day
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your balance will only show on this day each week
              </p>
            </div>
            
            <select
              id="revealDay"
              value={revealDay}
              onChange={(e) => setRevealDay(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 focus:border-blue-600 outline-none transition-all"
            >
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={!balance.trim() || isLoading}
            className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl transition-colors text-lg"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" />
                </svg>
                Setting up...
              </div>
            ) : (
              'Start Budgeting'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            Offline-first • Privacy by design • Your data stays local
          </p>
        </div>
      </main>
    </div>
  );
}
