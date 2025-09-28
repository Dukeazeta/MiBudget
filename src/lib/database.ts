import Dexie, { Table } from 'dexie';
import { Settings, Category, Transaction, Budget, Goal } from '@/lib/types';
import { generateId, now } from '@/lib/utils';

// Define the database schema
export class MiBudgetDB extends Dexie {
  // Tables
  settings!: Table<Settings>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;
  budgets!: Table<Budget>;
  goals!: Table<Goal>;

  constructor() {
    super('MiBudgetDB');
    
    this.version(1).stores({
      settings: 'id, created_at, updated_at, deleted, currency_code, reveal_day, hide_balance, initial_balance_cents, timezone',
      categories: 'id, created_at, updated_at, deleted, name, color, icon',
      transactions: 'id, created_at, updated_at, deleted, amount_cents, type, category_id, goal_id, description, occurred_at',
      budgets: 'id, created_at, updated_at, deleted, category_id, period, period_start, period_end, allocated_cents, carryover',
      goals: 'id, created_at, updated_at, deleted, name, target_cents, saved_cents, due_date'
    });
  }
}

// Create database instance
export const db = new MiBudgetDB();

// Database service class for business logic
export class DatabaseService {
  
  // Settings operations (singleton pattern)
  async getSettings(): Promise<Settings | null> {
    const settings = await db.settings
      .filter(s => !s.deleted)
      .toArray();
    
    return settings.length > 0 ? settings[0] : null;
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const existing = await this.getSettings();
    
    if (existing) {
      const updated: Settings = {
        ...existing,
        ...updates,
        updated_at: now()
      };
      
      await db.settings.put(updated);
      return updated;
    } else {
      // Create new settings
      const newSettings: Settings = {
        id: 'default',
        created_at: now(),
        updated_at: now(),
        deleted: false,
        currency_code: 'USD',
        reveal_day: 6,
        hide_balance: true,
        initial_balance_cents: 0,
        ...updates,
      };
      
      await db.settings.add(newSettings);
      return newSettings;
    }
  }

  // Transaction operations
  async getTransactions(): Promise<Transaction[]> {
    return await db.transactions
      .filter(t => !t.deleted)
      .toArray();
  }

  async createTransaction(transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
      ...transactionData,
    };
    
    await db.transactions.add(newTransaction);
    return newTransaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const existing = await db.transactions.get(id);
    if (!existing) return undefined;
    
    const updated: Transaction = {
      ...existing,
      ...updates,
      updated_at: now()
    };
    
    await db.transactions.put(updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const existing = await db.transactions.get(id);
    if (!existing) return false;
    
    const updated: Transaction = {
      ...existing,
      deleted: true,
      updated_at: now()
    };
    
    await db.transactions.put(updated);
    return true;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.categories
      .filter(c => !c.deleted)
      .toArray();
  }

  async createCategory(categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Category> {
    const newCategory: Category = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
      ...categoryData,
    };
    
    await db.categories.add(newCategory);
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const existing = await db.categories.get(id);
    if (!existing) return undefined;
    
    const updated: Category = {
      ...existing,
      ...updates,
      updated_at: now()
    };
    
    await db.categories.put(updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const existing = await db.categories.get(id);
    if (!existing) return false;
    
    const updated: Category = {
      ...existing,
      deleted: true,
      updated_at: now()
    };
    
    await db.categories.put(updated);
    return true;
  }

  // Budget operations
  async getBudgets(): Promise<Budget[]> {
    return await db.budgets
      .filter(b => !b.deleted)
      .toArray();
  }

  async createBudget(budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Budget> {
    const newBudget: Budget = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
      ...budgetData,
    };
    
    await db.budgets.add(newBudget);
    return newBudget;
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | undefined> {
    const existing = await db.budgets.get(id);
    if (!existing) return undefined;
    
    const updated: Budget = {
      ...existing,
      ...updates,
      updated_at: now()
    };
    
    await db.budgets.put(updated);
    return updated;
  }

  async deleteBudget(id: string): Promise<boolean> {
    const existing = await db.budgets.get(id);
    if (!existing) return false;
    
    const updated: Budget = {
      ...existing,
      deleted: true,
      updated_at: now()
    };
    
    await db.budgets.put(updated);
    return true;
  }

  // Goal operations
  async getGoals(): Promise<Goal[]> {
    return await db.goals
      .filter(g => !g.deleted)
      .toArray();
  }

  async createGoal(goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Goal> {
    const newGoal: Goal = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
      ...goalData,
    };
    
    await db.goals.add(newGoal);
    return newGoal;
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined> {
    const existing = await db.goals.get(id);
    if (!existing) return undefined;
    
    const updated: Goal = {
      ...existing,
      ...updates,
      updated_at: now()
    };
    
    await db.goals.put(updated);
    return updated;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const existing = await db.goals.get(id);
    if (!existing) return false;
    
    const updated: Goal = {
      ...existing,
      deleted: true,
      updated_at: now()
    };
    
    await db.goals.put(updated);
    return true;
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    await db.transaction('rw', [db.settings, db.categories, db.transactions, db.budgets, db.goals], async () => {
      await db.settings.clear();
      await db.categories.clear();
      await db.transactions.clear();
      await db.budgets.clear();
      await db.goals.clear();
    });
  }

  async exportData() {
    const data = {
      metadata: {
        exportedAt: now(),
        version: '1.0.0'
      },
      settings: await db.settings.toArray(),
      categories: await db.categories.toArray(),
      transactions: await db.transactions.toArray(),
      budgets: await db.budgets.toArray(),
      goals: await db.goals.toArray()
    };
    
    return data;
  }
}

// Export singleton instance
export const database = new DatabaseService();