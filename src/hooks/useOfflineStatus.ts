import { useState, useEffect } from 'react';
import { toast } from '@/components/Toast';

export interface OfflineStatus {
  isOnline: boolean;
  isBackOnline: boolean;
  hasBeenOffline: boolean;
}

export const useOfflineStatus = () => {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isBackOnline: false,
    hasBeenOffline: false,
  });

  useEffect(() => {
    const handleOnline = () => {
      const wasOffline = !status.isOnline;
      setStatus(prev => ({
        isOnline: true,
        isBackOnline: wasOffline && prev.hasBeenOffline,
        hasBeenOffline: prev.hasBeenOffline,
      }));
      
      // Show toast when coming back online
      if (wasOffline) {
        toast.success('Back online', 'Your changes will now sync automatically');
      }
    };

    const handleOffline = () => {
      setStatus(prev => ({
        isOnline: false,
        isBackOnline: false,
        hasBeenOffline: true,
      }));
      
      // Show toast when going offline
      toast.warning('You\'re offline', 'Changes will be saved locally and sync when you\'re back online');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also listen for network changes through navigator.connection if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const handleConnectionChange = () => {
        // Check if effective type suggests we're actually offline
        if (connection.effectiveType === 'slow-2g' && connection.downlink < 0.1) {
          handleOffline();
        } else if (!status.isOnline && connection.effectiveType !== 'slow-2g') {
          handleOnline();
        }
      };
      
      connection.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [status.isOnline]);

  // Reset isBackOnline after a short delay
  useEffect(() => {
    if (status.isBackOnline) {
      const timer = setTimeout(() => {
        setStatus(prev => ({ ...prev, isBackOnline: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status.isBackOnline]);

  return status;
};