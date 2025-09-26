import { JSONFilePreset } from 'lowdb/node';
import { join } from 'path';
import type {
  Settings,
  Category,
  Transaction,
  Budget,
  Goal,
} from '@mibudget/shared';

// Database schema
export interface DatabaseSchema {
  settings: Settings | null;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
}

// Default data
const defaultData: DatabaseSchema = {
  settings: null,
  categories: [],
  transactions: [],
  budgets: [],
  goals: [],
};

export class Database {
  private db!: Awaited<ReturnType<typeof JSONFilePreset<DatabaseSchema>>>;
  private initialized = false;

  constructor(private filePath: string = join(process.cwd(), '../../data', 'db.json')) {}

  async init(): Promise<void> {
    if (this.initialized) return;
    
    this.db = await JSONFilePreset(this.filePath, defaultData);
    
    // Initialize default settings if not present
    if (!this.db.data.settings) {
      const now = Date.now();
      this.db.data.settings = {
        id: 'default',
        created_at: now,
        updated_at: now,
        deleted: false,
        currency_code: 'USD',
        reveal_day: 6, // Saturday
        hide_balance: true,
        initial_balance_cents: 0,
      };
      await this.db.write();
    }
    
    this.initialized = true;
  }

  // Settings operations
  async getSettings(): Promise<Settings | null> {
    await this.init();
    return this.db.data.settings;
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    await this.init();
    const now = Date.now();
    
    this.db.data.settings = {
      ...this.db.data.settings!,
      ...settings,
      updated_at: now,
    };
    
    await this.db.write();
    return this.db.data.settings;
  }

  // Categories operations
  async getCategories(since?: number): Promise<Category[]> {
    await this.init();
    const categories = this.db.data.categories.filter(c => !c.deleted);
    
    if (since) {
      return categories.filter(c => c.updated_at > since);
    }
    
    return categories;
  }

  async getCategoryById(id: string): Promise<Category | null> {
    await this.init();
    return this.db.data.categories.find(c => c.id === id && !c.deleted) || null;
  }

  async createCategory(category: Category): Promise<Category> {
    await this.init();
    this.db.data.categories.push(category);
    await this.db.write();
    return category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    await this.init();
    const index = this.db.data.categories.findIndex(c => c.id === id && !c.deleted);
    
    if (index === -1) return null;
    
    this.db.data.categories[index] = {
      ...this.db.data.categories[index],
      ...updates,
      updated_at: Date.now(),
    };
    
    await this.db.write();
    return this.db.data.categories[index];
  }

  async deleteCategory(id: string): Promise<boolean> {
    await this.init();
    const index = this.db.data.categories.findIndex(c => c.id === id && !c.deleted);
    
    if (index === -1) return false;
    
    this.db.data.categories[index].deleted = true;
    this.db.data.categories[index].updated_at = Date.now();
    
    await this.db.write();
    return true;
  }

  // Transactions operations
  async getTransactions(filters: {
    since?: number;
    category_id?: string;
    goal_id?: string;
    from?: string;
    to?: string;
  } = {}): Promise<Transaction[]> {
    await this.init();
    let transactions = this.db.data.transactions.filter(t => !t.deleted);
    
    if (filters.since) {
      transactions = transactions.filter(t => t.updated_at > filters.since!);
    }
    
    if (filters.category_id) {
      transactions = transactions.filter(t => t.category_id === filters.category_id);
    }
    
    if (filters.goal_id) {
      transactions = transactions.filter(t => t.goal_id === filters.goal_id);
    }
    
    if (filters.from) {
      transactions = transactions.filter(t => t.occurred_at >= filters.from!);
    }
    
    if (filters.to) {
      transactions = transactions.filter(t => t.occurred_at <= filters.to!);
    }
    
    return transactions.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    await this.init();
    return this.db.data.transactions.find(t => t.id === id && !t.deleted) || null;
  }

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    await this.init();
    this.db.data.transactions.push(transaction);
    await this.db.write();
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    await this.init();
    const index = this.db.data.transactions.findIndex(t => t.id === id && !t.deleted);
    
    if (index === -1) return null;
    
    this.db.data.transactions[index] = {
      ...this.db.data.transactions[index],
      ...updates,
      updated_at: Date.now(),
    };
    
    await this.db.write();
    return this.db.data.transactions[index];
  }

  async deleteTransaction(id: string): Promise<boolean> {
    await this.init();
    const index = this.db.data.transactions.findIndex(t => t.id === id && !t.deleted);
    
    if (index === -1) return false;
    
    this.db.data.transactions[index].deleted = true;
    this.db.data.transactions[index].updated_at = Date.now();
    
    await this.db.write();
    return true;
  }

  // Budgets operations
  async getBudgets(since?: number): Promise<Budget[]> {
    await this.init();
    const budgets = this.db.data.budgets.filter(b => !b.deleted);
    
    if (since) {
      return budgets.filter(b => b.updated_at > since);
    }
    
    return budgets;
  }

  async createBudget(budget: Budget): Promise<Budget> {
    await this.init();
    this.db.data.budgets.push(budget);
    await this.db.write();
    return budget;
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | null> {
    await this.init();
    const index = this.db.data.budgets.findIndex(b => b.id === id && !b.deleted);
    
    if (index === -1) return null;
    
    this.db.data.budgets[index] = {
      ...this.db.data.budgets[index],
      ...updates,
      updated_at: Date.now(),
    };
    
    await this.db.write();
    return this.db.data.budgets[index];
  }

  async deleteBudget(id: string): Promise<boolean> {
    await this.init();
    const index = this.db.data.budgets.findIndex(b => b.id === id && !b.deleted);
    
    if (index === -1) return false;
    
    this.db.data.budgets[index].deleted = true;
    this.db.data.budgets[index].updated_at = Date.now();
    
    await this.db.write();
    return true;
  }

  // Goals operations
  async getGoals(since?: number): Promise<Goal[]> {
    await this.init();
    const goals = this.db.data.goals.filter(g => !g.deleted);
    
    if (since) {
      return goals.filter(g => g.updated_at > since);
    }
    
    return goals;
  }

  async createGoal(goal: Goal): Promise<Goal> {
    await this.init();
    this.db.data.goals.push(goal);
    await this.db.write();
    return goal;
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
    await this.init();
    const index = this.db.data.goals.findIndex(g => g.id === id && !g.deleted);
    
    if (index === -1) return null;
    
    this.db.data.goals[index] = {
      ...this.db.data.goals[index],
      ...updates,
      updated_at: Date.now(),
    };
    
    await this.db.write();
    return this.db.data.goals[index];
  }

  async deleteGoal(id: string): Promise<boolean> {
    await this.init();
    const index = this.db.data.goals.findIndex(g => g.id === id && !g.deleted);
    
    if (index === -1) return false;
    
    this.db.data.goals[index].deleted = true;
    this.db.data.goals[index].updated_at = Date.now();
    
    await this.db.write();
    return true;
  }

  // Sync operations
  async getSyncData(since: number) {
    await this.init();
    
    return {
      settings: this.db.data.settings && this.db.data.settings.updated_at > since 
        ? [this.db.data.settings] 
        : [],
      categories: this.db.data.categories.filter(c => c.updated_at > since),
      transactions: this.db.data.transactions.filter(t => t.updated_at > since),
      budgets: this.db.data.budgets.filter(b => b.updated_at > since),
      goals: this.db.data.goals.filter(g => g.updated_at > since),
    };
  }

  async bulkUpdate(data: {
    settings?: Settings[];
    categories?: Category[];
    transactions?: Transaction[];
    budgets?: Budget[];
    goals?: Goal[];
  }): Promise<void> {
    await this.init();
    
    // Update settings (only one allowed)
    if (data.settings && data.settings.length > 0) {
      this.db.data.settings = data.settings[0];
    }
    
    // Update categories
    if (data.categories) {
      for (const category of data.categories) {
        const existingIndex = this.db.data.categories.findIndex(c => c.id === category.id);
        if (existingIndex >= 0) {
          this.db.data.categories[existingIndex] = category;
        } else {
          this.db.data.categories.push(category);
        }
      }
    }
    
    // Update transactions
    if (data.transactions) {
      for (const transaction of data.transactions) {
        const existingIndex = this.db.data.transactions.findIndex(t => t.id === transaction.id);
        if (existingIndex >= 0) {
          this.db.data.transactions[existingIndex] = transaction;
        } else {
          this.db.data.transactions.push(transaction);
        }
      }
    }
    
    // Update budgets
    if (data.budgets) {
      for (const budget of data.budgets) {
        const existingIndex = this.db.data.budgets.findIndex(b => b.id === budget.id);
        if (existingIndex >= 0) {
          this.db.data.budgets[existingIndex] = budget;
        } else {
          this.db.data.budgets.push(budget);
        }
      }
    }
    
    // Update goals
    if (data.goals) {
      for (const goal of data.goals) {
        const existingIndex = this.db.data.goals.findIndex(g => g.id === goal.id);
        if (existingIndex >= 0) {
          this.db.data.goals[existingIndex] = goal;
        } else {
          this.db.data.goals.push(goal);
        }
      }
    }
    
    await this.db.write();
  }
}

// Export singleton instance
export const db = new Database();