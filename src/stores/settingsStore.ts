import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Settings, isRevealDay } from '@mibudget/shared';
import { db } from '../services/database';
import { syncEngine } from '../services/syncEngine';

interface SettingsStore {
  settings: Settings | null;
  isBalanceVisible: boolean;
  isLoading: boolean;
  
  // Actions
  loadSettings: () => Promise<void>;
  setSettings: (settings: Settings) => void;
  updateSettings: (updates: Partial<Settings>) => Promise<void>;
  checkBalanceVisibility: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    (set, get) => ({
      settings: null,
      isBalanceVisible: false,
      isLoading: false,

      loadSettings: async () => {
        try {
          set({ isLoading: true });
          const settings = await db.getSettings();
          set({ settings });
          if (settings) {
            get().checkBalanceVisibility();
          }
        } catch (error) {
          console.error('Failed to load settings:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      setSettings: (settings: Settings) => {
        set({ settings });
        get().checkBalanceVisibility();
      },

      updateSettings: async (updates: Partial<Settings>) => {
        try {
          const updatedSettings = await db.updateSettings(updates);
          set({ settings: updatedSettings });
          get().checkBalanceVisibility();
          
          // Trigger sync in background
          if (navigator.onLine) {
            syncEngine.sync().catch(console.error);
          }
        } catch (error) {
          console.error('Failed to update settings:', error);
          throw error;
        }
      },

      checkBalanceVisibility: () => {
        const { settings } = get();
        if (!settings) return;
        
        const visible = !settings.hide_balance || isRevealDay(settings.reveal_day, settings.timezone);
        set({ isBalanceVisible: visible });
      },
    }),
    { name: 'settings-store' }
  )
);
