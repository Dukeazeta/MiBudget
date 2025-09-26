import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Transaction, 
  Category, 
  Budget, 
  Goal, 
  calculateBalance 
} from '@mibudget/shared';

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
  
  // Computed
  balance: number;
  
  // Actions
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  
  // Sync
  setOnlineStatus: (isOnline: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setLastSync: (timestamp: number) => void;
  
  // Computed selectors
  getBalance: () => number;
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
      balance: 0,

      // Transaction actions
      setTransactions: (transactions: Transaction[]) => {
        set({ transactions });
        // Recalculate balance
        const balance = calculateBalance(transactions);
        set({ balance });
      },

      addTransaction: (transaction: Transaction) => {
        const transactions = [...get().transactions, transaction];
        set({ transactions });
        const balance = calculateBalance(transactions);
        set({ balance });
      },

      updateTransaction: (id: string, updates: Partial<Transaction>) => {
        const transactions = get().transactions.map(t => 
          t.id === id ? { ...t, ...updates } : t
        );
        set({ transactions });
        const balance = calculateBalance(transactions);
        set({ balance });
      },

      deleteTransaction: (id: string) => {
        const transactions = get().transactions.filter(t => t.id !== id);
        set({ transactions });
        const balance = calculateBalance(transactions);
        set({ balance });
      },

      // Category actions
      setCategories: (categories: Category[]) => set({ categories }),
      
      addCategory: (category: Category) => {
        const categories = [...get().categories, category];
        set({ categories });
      },

      updateCategory: (id: string, updates: Partial<Category>) => {
        const categories = get().categories.map(c => 
          c.id === id ? { ...c, ...updates } : c
        );
        set({ categories });
      },

      deleteCategory: (id: string) => {
        const categories = get().categories.filter(c => c.id !== id);
        set({ categories });
      },

      // Budget actions
      setBudgets: (budgets: Budget[]) => set({ budgets }),
      
      addBudget: (budget: Budget) => {
        const budgets = [...get().budgets, budget];
        set({ budgets });
      },

      updateBudget: (id: string, updates: Partial<Budget>) => {
        const budgets = get().budgets.map(b => 
          b.id === id ? { ...b, ...updates } : b
        );
        set({ budgets });
      },

      deleteBudget: (id: string) => {
        const budgets = get().budgets.filter(b => b.id !== id);
        set({ budgets });
      },

      // Goal actions
      setGoals: (goals: Goal[]) => set({ goals }),
      
      addGoal: (goal: Goal) => {
        const goals = [...get().goals, goal];
        set({ goals });
      },

      updateGoal: (id: string, updates: Partial<Goal>) => {
        const goals = get().goals.map(g => 
          g.id === id ? { ...g, ...updates } : g
        );
        set({ goals });
      },

      deleteGoal: (id: string) => {
        const goals = get().goals.filter(g => g.id !== id);
        set({ goals });
      },

      // Sync actions
      setOnlineStatus: (isOnline: boolean) => set({ isOnline }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setLastSync: (timestamp: number) => set({ lastSync: timestamp }),

      // Selectors
      getBalance: () => {
        const { transactions } = get();
        return calculateBalance(transactions);
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