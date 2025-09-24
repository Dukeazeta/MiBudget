import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useAppStore } from '../stores/appStoreWithDB';
import { Logo } from '../components/Logo';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DAYS_OF_WEEK, formatMoney } from '@mibudget/shared';

export function SettingsPage() {
  const { settings, updateSettings } = useSettingsStore();
  const { transactions, categories, budgets, goals, isOnline, isSyncing, balance } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  if (!settings) return null;

  const handleCurrencyChange = async (currency: string) => {
    setIsLoading(true);
    try {
      await updateSettings({ currency_code: currency });
    } catch (error) {
      console.error('Failed to update currency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevealDayChange = async (day: number) => {
    setIsLoading(true);
    try {
      await updateSettings({ reveal_day: day });
    } catch (error) {
      console.error('Failed to update reveal day:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHideBalanceToggle = async () => {
    setIsLoading(true);
    try {
      await updateSettings({ hide_balance: !settings.hide_balance });
    } catch (error) {
      console.error('Failed to update hide balance setting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    const data = {
      settings,
      transactions: transactions.filter(t => !t.deleted),
      categories: categories.filter(c => !c.deleted),
      budgets: budgets.filter(b => !b.deleted),
      goals: goals.filter(g => !g.deleted),
      exported_at: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mibudget-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = async () => {
    // This would need to be implemented in the store
    console.warn('Delete all data not implemented yet');
    setShowDeleteConfirm(false);
  };

  const totalTransactions = transactions.filter(t => !t.deleted).length;
  const totalCategories = categories.filter(c => !c.deleted).length;
  const totalBudgets = budgets.filter(b => !b.deleted).length;
  const totalGoals = goals.filter(g => !g.deleted).length;

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
                  <span className="text-sm text-gray-500 font-medium">
                    Settings
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-6">
          
          {/* App Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">App Information</h2>
              <div className="flex items-center space-x-2">
                <Logo size="sm" />
                <span className="text-sm text-gray-500">v0.1.0</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{totalTransactions}</div>
                <div className="text-xs text-gray-500">Transactions</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{totalCategories}</div>
                <div className="text-xs text-gray-500">Categories</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{totalBudgets}</div>
                <div className="text-xs text-gray-500">Budgets</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{totalGoals}</div>
                <div className="text-xs text-gray-500">Goals</div>
              </div>
            </div>
          </div>

          {/* Currency Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Currency & Display</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  id="currency"
                  value={settings.currency_code}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  disabled={isLoading}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                  <option value="CHF">CHF - Swiss Franc</option>
                  <option value="SEK">SEK - Swedish Krona</option>
                  <option value="NOK">NOK - Norwegian Krone</option>
                  <option value="DKK">DKK - Danish Krone</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Current balance: {formatMoney(balance, settings.currency_code)}
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Balance Display</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="revealDay" className="block text-sm font-medium text-gray-700 mb-2">
                  Balance Reveal Day
                </label>
                <select
                  id="revealDay"
                  value={settings.reveal_day}
                  onChange={(e) => handleRevealDayChange(Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Your balance will only be visible on {DAYS_OF_WEEK[settings.reveal_day]}s
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-1a2 2 0 00-2-2H6a2 2 0 00-2 2v1a2 2 0 002 2zM13 10V9a1 1 0 00-1-1h-1a1 1 0 00-1 1v1a1 1 0 001 1h1a1 1 0 001-1z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">Hide Balance</h3>
                    <p className="text-sm text-blue-700">
                      Enable privacy mode to reduce financial anxiety
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleHideBalanceToggle}
                  disabled={isLoading}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    settings.hide_balance ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings.hide_balance ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Export Data</h3>
                  <p className="text-sm text-gray-500">
                    Download all your data as JSON file for backup
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Export
                </button>
              </div>

              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h3 className="text-sm font-medium text-red-900">Delete All Data</h3>
                  <p className="text-sm text-red-700">
                    Permanently delete all transactions, budgets, and settings
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>

          {/* Sync Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    isSyncing ? 'bg-yellow-400 animate-pulse' : 
                    isOnline ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">
                    {isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                {isOnline && (
                  <span className="text-xs text-gray-500">
                    Data syncs automatically when online
                  </span>
                )}
              </div>
              
              {!isOnline && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    You're currently offline. Your changes are being saved locally and will sync when you're back online.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About MiBudget</h2>
            
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                MiBudget is an offline-first personal finance tracker designed to reduce financial anxiety 
                through privacy-focused balance hiding and thoughtful transaction management.
              </p>
              <p>
                Your data is stored locally on your device and synced securely when online. 
                We never store your financial information on external servers without your explicit consent.
              </p>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Version 0.1.0</span>
                  <span>Built with ❤️ for privacy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-20" />
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">
                  Delete All Data
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. All your transactions, budgets, goals, and settings will be permanently deleted.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllData}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                >
                  Delete All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4">
            <LoadingSpinner size="sm" message="Updating settings..." />
          </div>
        </div>
      )}
    </div>
  );
}