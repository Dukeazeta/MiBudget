import Dexie, { Table } from 'dexie';
import { 
  Settings, 
  Category, 
  Transaction, 
  Budget, 
  Goal,
  generateId,
  now 
} from '@mibudget/shared';

// Outbox pattern for queuing mutations
export interface OutboxItem {
  id: string;
  entity: 'settings' | 'categories' | 'transactions' | 'budgets' | 'goals';
  operation: 'create' | 'update' | 'delete';
  payload: any;
  createdAt: number;
  synced: boolean;
  retryCount: number;
}

// Sync state tracking
export interface SyncState {
  id: string; // Always 'default'
  clientId: string;
  lastSync: number;
  lastFullSync: number;
}

export class MiBudgetDatabase extends Dexie {
  // Data tables
  settings!: Table<Settings>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;
  budgets!: Table<Budget>;
  goals!: Table<Goal>;
  
  // Sync tables
  outbox!: Table<OutboxItem>;
  syncState!: Table<SyncState>;

  constructor() {
    super('MiBudgetDB');
    
    this.version(1).stores({
      settings: 'id, updated_at, deleted',
      categories: 'id, updated_at, deleted, name',
      transactions: 'id, updated_at, deleted, occurred_at, type, category_id, goal_id',
      budgets: 'id, updated_at, deleted, category_id, period_start, period_end',
      goals: 'id, updated_at, deleted, due_date',
      outbox: 'id, entity, operation, createdAt, synced',
      syncState: 'id'
    });

    // Initialize client ID on first run
    this.on('ready', async () => {
      const syncState = await this.syncState.get('default');
      if (!syncState) {
        await this.syncState.add({
          id: 'default',
          clientId: generateId(),
          lastSync: 0,
          lastFullSync: 0,
        });
      }
    });
  }

  // Generic CRUD operations with outbox queueing
  async createWithOutbox<T extends { id: string; updated_at: number }>(
    table: Table<T>,
    entity: OutboxItem['entity'],
    item: T
  ): Promise<T> {
    return this.transaction('rw', [table, this.outbox], async () => {
      // Add to main table
      await table.add(item);
      
      // Queue in outbox
      await this.outbox.add({
        id: generateId(),
        entity,
        operation: 'create',
        payload: item,
        createdAt: now(),
        synced: false,
        retryCount: 0,
      });
      
      return item;
    });
  }

  async updateWithOutbox<T extends { id: string; updated_at: number }>(
    table: Table<T>,
    entity: OutboxItem['entity'],
    id: string,
    updates: Partial<T>
  ): Promise<T | undefined> {
    return this.transaction('rw', [table, this.outbox], async () => {
      const existing = await table.get(id);
      if (!existing) return undefined;

      const updated = { ...existing, ...updates, updated_at: now() };
      await table.update(id, updated);
      
      // Queue in outbox
      await this.outbox.add({
        id: generateId(),
        entity,
        operation: 'update',
        payload: updated,
        createdAt: now(),
        synced: false,
        retryCount: 0,
      });
      
      return updated as T;
    });
  }

  async deleteWithOutbox<T extends { id: string; updated_at: number; deleted: boolean }>(
    table: Table<T>,
    entity: OutboxItem['entity'],
    id: string
  ): Promise<boolean> {
    return this.transaction('rw', [table, this.outbox], async () => {
      const existing = await table.get(id);
      if (!existing) return false;

      // Soft delete
      const updated = { ...existing, deleted: true, updated_at: now() };
      await table.update(id, updated);
      
      // Queue in outbox
      await this.outbox.add({
        id: generateId(),
        entity,
        operation: 'delete',
        payload: updated,
        createdAt: now(),
        synced: false,
        retryCount: 0,
      });
      
      return true;
    });
  }

  // Specialized methods for each entity
  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Category> {
    const newCategory: Category = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
      ...category,
    };
    
    return this.createWithOutbox(this.categories, 'categories', newCategory);
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    return this.updateWithOutbox(this.categories, 'categories', id, updates);
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.deleteWithOutbox(this.categories, 'categories', id);
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Transaction> {
    const newTransaction: Transaction = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
      ...transaction,
    };
    
    return this.createWithOutbox(this.transactions, 'transactions', newTransaction);
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    return this.updateWithOutbox(this.transactions, 'transactions', id, updates);
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.deleteWithOutbox(this.transactions, 'transactions', id);
  }

  async createBudget(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Budget> {
    const newBudget: Budget = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
      ...budget,
    };
    
    return this.createWithOutbox(this.budgets, 'budgets', newBudget);
  }

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | undefined> {
    return this.updateWithOutbox(this.budgets, 'budgets', id, updates);
  }

  async deleteBudget(id: string): Promise<boolean> {
    return this.deleteWithOutbox(this.budgets, 'budgets', id);
  }

  async createGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'deleted'>): Promise<Goal> {
    const newGoal: Goal = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      deleted: false,
      ...goal,
    };
    
    return this.createWithOutbox(this.goals, 'goals', newGoal);
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | undefined> {
    return this.updateWithOutbox(this.goals, 'goals', id, updates);
  }

  async deleteGoal(id: string): Promise<boolean> {
    return this.deleteWithOutbox(this.goals, 'goals', id);
  }

  // Settings management (singleton)
  async getSettings(): Promise<Settings | null> {
    const settings = await this.settings.orderBy('updated_at').reverse().first();
    return settings && !settings.deleted ? settings : null;
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const existing = await this.getSettings();
    
    if (existing) {
      const updated = await this.updateWithOutbox(this.settings, 'settings', existing.id, updates);
      return updated!;
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
      
      return this.createWithOutbox(this.settings, 'settings', newSettings);
    }
  }

  // Sync operations
  async getUnsyncedItems(): Promise<OutboxItem[]> {
    return this.outbox.where('synced').equals(0).toArray();
  }

  async markAsSynced(outboxIds: string[]): Promise<void> {
    await this.outbox.where('id').anyOf(outboxIds).modify({ synced: true });
  }

  async incrementRetryCount(outboxId: string): Promise<void> {
    const item = await this.outbox.get(outboxId);
    if (item) {
      await this.outbox.update(outboxId, { retryCount: item.retryCount + 1 });
    }
  }

  async getSyncState(): Promise<SyncState> {
    const state = await this.syncState.get('default');
    if (!state) {
      throw new Error('Sync state not initialized');
    }
    return state;
  }

  async updateSyncState(updates: Partial<SyncState>): Promise<void> {
    await this.syncState.update('default', updates);
  }

  // Bulk operations for sync
  async bulkUpsert<T extends { id: string; updated_at: number }>(
    table: Table<T>,
    items: T[]
  ): Promise<void> {
    await this.transaction('rw', table, async () => {
      for (const item of items) {
        const existing = await table.get(item.id);
        if (existing) {
          // Only update if server version is newer
          if (item.updated_at > existing.updated_at) {
            await table.update(item.id, item);
          }
        } else {
          await table.add(item);
        }
      }
    });
  }

  // Data export/import for debugging
  async exportData() {
    return {
      settings: await this.settings.toArray(),
      categories: await this.categories.toArray(),
      transactions: await this.transactions.toArray(),
      budgets: await this.budgets.toArray(),
      goals: await this.goals.toArray(),
      outbox: await this.outbox.toArray(),
      syncState: await this.syncState.toArray(),
    };
  }

  async clearAllData(): Promise<void> {
    await this.transaction('rw', [
      this.settings,
      this.categories, 
      this.transactions,
      this.budgets,
      this.goals,
      this.outbox,
      this.syncState
    ], async () => {
      await this.settings.clear();
      await this.categories.clear();
      await this.transactions.clear();
      await this.budgets.clear();
      await this.goals.clear();
      await this.outbox.clear();
      await this.syncState.clear();
    });
  }
}

// Export singleton instance
export const db = new MiBudgetDatabase();