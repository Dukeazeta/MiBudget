'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStoreWithDB';
import { DashboardSkeleton } from './Skeleton';

interface AppInitializerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AppInitializer({ children, fallback }: AppInitializerProps) {
  const router = useRouter();
  const { settings, isLoading: settingsLoading, loadSettings } = useSettingsStore();
  const { isLoading: appLoading, loadAllData } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [redirectingToOnboarding, setRedirectingToOnboarding] = useState(false);

  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('[AppInitializer] Starting app initialization...');
        
        // Load settings first
        await loadSettings();
        
        // Load app data
        await loadAllData();
        
        console.log('[AppInitializer] App initialization complete');
        setIsInitialized(true);
      } catch (error) {
        console.error('[AppInitializer] Failed to initialize app:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize app');
      }
    }

    initializeApp();
  }, [loadSettings, loadAllData]);

  // Show loading state while initializing
  if (!isInitialized || settingsLoading || appLoading || redirectingToOnboarding) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Use skeleton if we're initializing data, otherwise show spinner for onboarding redirect
    if (redirectingToOnboarding) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to MiBudget</h2>
            <p className="text-gray-600">Setting up your account...</p>
          </div>
        </div>
      );
    }

    return <DashboardSkeleton />;
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initialization Error</h2>
          <p className="text-gray-600 mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If no settings exist, redirect to onboarding
  if (!settings) {
    if (!redirectingToOnboarding) {
      setRedirectingToOnboarding(true);
      router.push('/onboarding');
    }
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to MiBudget</h2>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
