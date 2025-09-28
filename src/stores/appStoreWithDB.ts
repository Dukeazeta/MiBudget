import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Transaction, Category, Budget, Goal, Settings } from '@/lib/types';
import { calculateBalance } from '@/lib/utils';
import { database } from '@/lib/database';

interface AppStore {
  // Data
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  
  // UI State
  isOnline: boolean;
  isLoading: boolean;
  lastSync: number;
  isSyncing: boolean;
  
  // Computed
  balance: number;
  
  // Actions - Transaction operations
  loadTransactions: () => Promise<void>;
  createTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'deleted'>) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Actions - Category operations
  loadCategories: () => Promise<void>;
  createCategory: (category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'deleted'>) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Actions - Budget operations
  loadBudgets: () => Promise<void>;
  createBudget: (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'deleted'>) => Promise<Budget>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  
  // Actions - Goal operations
  loadGoals: () => Promise<void>;
  createGoal: (goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'deleted'>) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  // Sync operations
  setOnlineStatus: (isOnline: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setSyncStatus: (isSyncing: boolean) => void;
  triggerSync: () => Promise<void>;
  
  // Data loading
  loadAllData: () => Promise<void>;
  
  // Computed selectors
  getBalance: () => number;
  getBalanceWithInitial: (settings?: Settings | null) => Promise<number>;
  getCategoryById: (id: string) => Category | undefined;
  getGoalById: (id: string) => Goal | undefined;
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      transactions: [],
      categories: [],
      budgets: [],
      goals: [],
      isOnline: navigator.onLine,
      isLoading: false,
      lastSync: 0,
      isSyncing: false,
      balance: 0,

      // Transaction operations
      loadTransactions: async () => {
        try {
          set({ isLoading: true });
          const transactions = await database.getTransactions();
          const settings = await database.getSettings();
          const balance = calculateBalance(transactions, settings?.initial_balance_cents || 0);
          set({ transactions, balance });
        } catch (error) {
          console.error('Failed to load transactions:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      createTransaction: async (transactionData) => {
        try {
          const transaction = await database.createTransaction(transactionData);
          
          // Update state optimistically
          const currentTransactions = get().transactions;
          const newTransactions = [...currentTransactions, transaction];
          const settings = await database.getSettings();
          const balance = calculateBalance(newTransactions, settings?.initial_balance_cents || 0);
          set({ transactions: newTransactions, balance });
          
          return transaction;
        } catch (error) {
          console.error('Failed to create transaction:', error);
          throw error;
        }
      },

      updateTransaction: async (id, updates) => {
        try {
          const updated = await database.updateTransaction(id, updates);
          if (!updated) return;
          
          // Update state optimistically
          const currentTransactions = get().transactions;
          const newTransactions = currentTransactions.map(t => 
            t.id === id ? updated : t
          );
          const settings = await database.getSettings();
          const balance = calculateBalance(newTransactions, settings?.initial_balance_cents || 0);
          set({ transactions: newTransactions, balance });
        } catch (error) {
          console.error('Failed to update transaction:', error);
          throw error;
        }
      },

      deleteTransaction: async (id) => {
        try {
          const success = await database.deleteTransaction(id);
          if (!success) return;
          
          // Update state optimistically (remove from display)
          const currentTransactions = get().transactions;
          const newTransactions = currentTransactions.filter(t => t.id !== id);
          const settings = await database.getSettings();
          const balance = calculateBalance(newTransactions, settings?.initial_balance_cents || 0);
          set({ transactions: newTransactions, balance });
        } catch (error) {
          console.error('Failed to delete transaction:', error);
          throw error;
        }
      },

      // Category operations
      loadCategories: async () => {
        try {
          const categories = await database.getCategories();
          set({ categories });
        } catch (error) {
          console.error('Failed to load categories:', error);
        }
      },

      createCategory: async (categoryData) => {
        try {
          const category = await database.createCategory(categoryData);
          
          // Update state optimistically
          const currentCategories = get().categories;
          set({ categories: [...currentCategories, category] });
          
          return category;
        } catch (error) {
          console.error('Failed to create category:', error);
          throw error;
        }
      },

      updateCategory: async (id, updates) => {
        try {
          const updated = await database.updateCategory(id, updates);
          if (!updated) return;
          
          // Update state optimistically
          const currentCategories = get().categories;
          const newCategories = currentCategories.map(c => 
            c.id === id ? updated : c
          );
          set({ categories: newCategories });
        } catch (error) {
          console.error('Failed to update category:', error);
          throw error;
        }
      },

      deleteCategory: async (id) => {
        try {
          const success = await database.deleteCategory(id);
          if (!success) return;
          
          // Update state optimistically
          const currentCategories = get().categories;
          const newCategories = currentCategories.filter(c => c.id !== id);
          set({ categories: newCategories });
        } catch (error) {
          console.error('Failed to delete category:', error);
          throw error;
        }
      },

      // Budget operations
      loadBudgets: async () => {
        try {
          const budgets = await database.getBudgets();
          set({ budgets });
        } catch (error) {
          console.error('Failed to load budgets:', error);
        }
      },

      createBudget: async (budgetData) => {
        try {
          const budget = await database.createBudget(budgetData);
          
          // Update state optimistically
          const currentBudgets = get().budgets;
          set({ budgets: [...currentBudgets, budget] });
          
          return budget;
        } catch (error) {
          console.error('Failed to create budget:', error);
          throw error;
        }
      },

      updateBudget: async (id, updates) => {
        try {
          const updated = await database.updateBudget(id, updates);
          if (!updated) return;
          
          // Update state optimistically
          const currentBudgets = get().budgets;
          const newBudgets = currentBudgets.map(b => 
            b.id === id ? updated : b
          );
          set({ budgets: newBudgets });
        } catch (error) {
          console.error('Failed to update budget:', error);
          throw error;
        }
      },

      deleteBudget: async (id) => {
        try {
          const success = await database.deleteBudget(id);
          if (!success) return;
          
          // Update state optimistically
          const currentBudgets = get().budgets;
          const newBudgets = currentBudgets.filter(b => b.id !== id);
          set({ budgets: newBudgets });
        } catch (error) {
          console.error('Failed to delete budget:', error);
          throw error;
        }
      },

      // Goal operations
      loadGoals: async () => {
        try {
          const goals = await database.getGoals();
          set({ goals });
        } catch (error) {
          console.error('Failed to load goals:', error);
        }
      },

      createGoal: async (goalData) => {
        try {
          const goal = await database.createGoal(goalData);
          
          // Update state optimistically
          const currentGoals = get().goals;
          set({ goals: [...currentGoals, goal] });
          
          return goal;
        } catch (error) {
          console.error('Failed to create goal:', error);
          throw error;
        }
      },

      updateGoal: async (id, updates) => {
        try {
          const updated = await database.updateGoal(id, updates);
          if (!updated) return;
          
          // Update state optimistically
          const currentGoals = get().goals;
          const newGoals = currentGoals.map(g => 
            g.id === id ? updated : g
          );
          set({ goals: newGoals });
        } catch (error) {
          console.error('Failed to update goal:', error);
          throw error;
        }
      },

      deleteGoal: async (id) => {
        try {
          const success = await database.deleteGoal(id);
          if (!success) return;
          
          // Update state optimistically
          const currentGoals = get().goals;
          const newGoals = currentGoals.filter(g => g.id !== id);
          set({ goals: newGoals });
        } catch (error) {
          console.error('Failed to delete goal:', error);
          throw error;
        }
      },

      // Sync operations
      setOnlineStatus: (isOnline: boolean) => {
        set({ isOnline });
        if (isOnline) {
          // Trigger sync when coming online
          
        }
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),
      setSyncStatus: (isSyncing: boolean) => set({ isSyncing }),

      triggerSync: async () => {
        // Sync functionality disabled for now
        console.log('[Store] Sync disabled for now');
        return Promise.resolve();
      },

      // Load all data from IndexedDB
      loadAllData: async () => {
        try {
          set({ isLoading: true });
          
          await Promise.all([
            get().loadTransactions(),
            get().loadCategories(),
            get().loadBudgets(),
            get().loadGoals(),
          ]);
          
        } catch (error) {
          console.error('Failed to load data:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Selectors
      getBalance: () => {
        return get().balance;
      },

      getBalanceWithInitial: async (settings?: Settings | null) => {
        const { transactions } = get();
        const currentSettings = settings || await database.getSettings();
        return calculateBalance(transactions, currentSettings?.initial_balance_cents || 0);
      },

      getCategoryById: (id: string) => {
        return get().categories.find(c => c.id === id);
      },

      getGoalById: (id: string) => {
        return get().goals.find(g => g.id === id);
      },
    }),
    { name: 'app-store' }
  )
);