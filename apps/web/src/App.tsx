import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSettingsStore } from './stores/settingsStore';
import { useAppStore } from './stores/appStoreWithDB';
import { syncEngine } from './services/syncEngine';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SplashScreen } from './components/SplashScreen';

function App() {
  const { settings, loadSettings, checkBalanceVisibility } = useSettingsStore();
  const { setOnlineStatus, loadAllData } = useAppStore();
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [initMessage, setInitMessage] = React.useState('Initializing...');

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
        setInitMessage('Loading settings...');
        await loadSettings();
        
        setInitMessage('Loading data...');
        await loadAllData();
        
        setInitMessage('Setting up sync...');
        // Start auto-sync if online
        if (navigator.onLine) {
          syncEngine.startAutoSync();
        }
        
        // Small delay to show the splash screen
        setInitMessage('Ready!');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitMessage('Failed to initialize. Please refresh.');
        // Still set as initialized to show the app, even if there was an error
        setTimeout(() => setIsInitialized(true), 2000);
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

  // Show splash screen during initialization
  if (!isInitialized) {
    return <SplashScreen message={initMessage} />;
  }

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
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;