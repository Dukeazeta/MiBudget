import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSettingsStore } from './stores/settingsStore';
import { useAppStore } from './stores/appStoreWithDB';
import { syncEngine } from './services/syncEngine';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';

function App() {
  const { settings, loadSettings, checkBalanceVisibility } = useSettingsStore();
  const { setOnlineStatus, loadAllData } = useAppStore();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  // Initialize app data and sync engine
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load settings and data from IndexedDB
        await Promise.all([
          loadSettings(),
          loadAllData(),
        ]);
        
        // Start auto-sync if online
        if (navigator.onLine) {
          syncEngine.startAutoSync();
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };
    
    initializeApp();
    
    // Cleanup sync engine on unmount
    return () => {
      syncEngine.stopAutoSync();
    };
  }, [loadSettings, loadAllData]);

  // Check balance visibility on mount and daily
  useEffect(() => {
    checkBalanceVisibility();
    
    // Check balance visibility every minute to handle day changes
    const interval = setInterval(checkBalanceVisibility, 60000);
    
    return () => clearInterval(interval);
  }, [checkBalanceVisibility]);

  // Show onboarding if no settings
  if (!settings) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;