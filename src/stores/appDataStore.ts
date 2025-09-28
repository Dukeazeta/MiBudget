// Re-export the main app store as appDataStore for backward compatibility
// This provides a consistent interface for components to use
export { useAppStore as useAppDataStore } from './appStoreWithDB';
