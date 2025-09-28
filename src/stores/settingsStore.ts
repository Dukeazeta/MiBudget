import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Settings } from '@/lib/types';
import { isRevealDay } from '@/lib/utils';
import { database } from '@/lib/database';

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
          const settings = await database.getSettings();
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
          const updatedSettings = await database.updateSettings(updates);
          set({ settings: updatedSettings });
          get().checkBalanceVisibility();
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
