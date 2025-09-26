// Re-export the app store with database integration as appDataStore
// This provides a consistent interface for components to use
import { useAppStore } from './appStoreWithDB';

// Create aliases for method names to match component expectations
export const useAppDataStore = () => {
  const store = useAppStore();
  
  return {
    ...store,
    // Alias createTransaction to addTransaction for component consistency
    addTransaction: store.createTransaction,
  };
};