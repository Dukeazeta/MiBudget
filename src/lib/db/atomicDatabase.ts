import { JSONFilePreset } from 'lowdb/node';
import { join } from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
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
  _metadata: {
    version: string;
    lastUpdated: number;
    revision: number;
  };
}

// Default data
const defaultData: DatabaseSchema = {
  settings: null,
  categories: [],
  transactions: [],
  budgets: [],
  goals: [],
  _metadata: {
    version: '1.0.0',
    lastUpdated: Date.now(),
    revision: 1,
  },
};

// Atomic operation wrapper
interface AtomicOperation<T = any> {
  id: string;
  timestamp: number;
  operation: () => Promise<T>;
}

export class AtomicDatabase {
  private db!: Awaited<ReturnType<typeof JSONFilePreset<DatabaseSchema>>>;
  private initialized = false;
  private operationQueue: AtomicOperation[] = [];
  private isProcessing = false;
  private backupDir: string;

  constructor(
    private filePath: string = join(process.cwd(), '../../data', 'db.json')
  ) {
    this.backupDir = join(process.cwd(), '../../data', 'backups');
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    // Ensure backup directory exists
    await fs.mkdir(this.backupDir, { recursive: true }).catch(() => {});
    
    this.db = await JSONFilePreset(this.filePath, defaultData);
    
    // Initialize default settings if not present
    if (!this.db.data.settings) {
      await this.atomicWrite(() => {
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
        this._updateMetadata();
        return Promise.resolve();
      });
    }
    
    this.initialized = true;
  }

  private _updateMetadata(): void {
    this.db.data._metadata = {
      ...this.db.data._metadata,
      lastUpdated: Date.now(),
      revision: (this.db.data._metadata.revision || 0) + 1,
    };
  }

  private async atomicWrite<T>(operation: () => Promise<T>): Promise<T> {
    const operationId = randomUUID();
    const atomicOp: AtomicOperation<T> = {
      id: operationId,
      timestamp: Date.now(),
      operation,
    };

    this.operationQueue.push(atomicOp);
    
    if (!this.isProcessing) {
      this.isProcessing = true;
      try {
        return await this.processQueue<T>(operationId);
      } finally {
        this.isProcessing = false;
      }
    } else {
      // Wait for our operation to be processed
      return new Promise((resolve, reject) => {
        const checkQueue = setInterval(() => {
          const completedOp = this.operationQueue.find(op => op.id === operationId);
          if (!completedOp) {
            clearInterval(checkQueue);
            // Operation was processed, but we need to get the result
            // This is a simplified approach - in production, you'd want a more robust result handling
            resolve(undefined as T);
          }
        }, 10);
      });
    }
  }

  private async processQueue<T>(targetOperationId?: string): Promise<T> {
    let result: T | undefined;
    
    while (this.operationQueue.length > 0) {
      const operation = this.operationQueue.shift()!;
      
      try {
        // Create backup before operation
        await this.createBackup(`pre-op-${operation.id}`);
        
        // Execute operation
        const opResult = await operation.operation();
        
        // Write to disk atomically
        await this.db.write();
        
        // Clean up old backup
        if (targetOperationId === operation.id) {
          result = opResult;
        }
        
        console.log(`[DB] Atomic operation ${operation.id} completed successfully`);
      } catch (error) {
        console.error(`[DB] Atomic operation ${operation.id} failed:`, error);
        
        // Restore from backup on failure
        await this.restoreBackup(`pre-op-${operation.id}`);
        throw error;
      }
    }
    
    return result!;
  }

  private async createBackup(suffix: string): Promise<void> {
    try {
      const backupPath = join(this.backupDir, `db-${suffix}-${Date.now()}.json`);
      const data = JSON.stringify(this.db.data, null, 2);
      await fs.writeFile(backupPath, data);
      
      // Keep only last 10 backups
      await this.cleanupBackups();
    } catch (error) {
      console.warn('[DB] Failed to create backup:', error);
    }
  }

  private async restoreBackup(suffix: string): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFile = files
        .filter(f => f.includes(suffix))
        .sort()
        .reverse()[0];
      
      if (backupFile) {
        const backupPath = join(this.backupDir, backupFile);
        const data = await fs.readFile(backupPath, 'utf-8');
        this.db.data = JSON.parse(data);
        await this.db.write();
        console.log('[DB] Restored from backup:', backupFile);
      }
    } catch (error) {
      console.error('[DB] Failed to restore backup:', error);
    }
  }

  private async cleanupBackups(): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = files
        .filter(f => f.startsWith('db-'))
        .sort()
        .reverse();
      
      // Keep only last 10 backups
      const toDelete = backups.slice(10);
      for (const file of toDelete) {
        await fs.unlink(join(this.backupDir, file));
      }
    } catch (error) {
      console.warn('[DB] Failed to cleanup backups:', error);
    }
  }

  // Settings operations
  async getSettings(): Promise<Settings | null> {
    await this.init();
    return this.db.data.settings;
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    await this.init();
    
    return this.atomicWrite(async () => {
      const now = Date.now();
      
      this.db.data.settings = {
        ...this.db.data.settings!,
        ...settings,
        updated_at: now,
      };
      
      this._updateMetadata();
      return this.db.data.settings;
    });
  }

  // Bulk sync operations with atomic guarantees
  async bulkSync(data: {
    settings?: Settings[];
    categories?: Category[];
    transactions?: Transaction[];
    budgets?: Budget[];
    goals?: Goal[];
  }): Promise<{ serverTime: number; conflicts: any[] }> {
    await this.init();
    
    return this.atomicWrite(async () => {
      const conflicts: any[] = [];
      const serverTime = Date.now();
      
      // Settings update (only one allowed)
      if (data.settings && data.settings.length > 0) {
        const newSettings = data.settings[0];
        const existing = this.db.data.settings;
        
        // Conflict detection (last-write-wins with timestamp)
        if (existing && existing.updated_at > newSettings.updated_at) {
          conflicts.push({
            type: 'settings',
            id: newSettings.id,
            reason: 'server_newer',
            clientTime: newSettings.updated_at,
            serverTime: existing.updated_at,
          });
        } else {
          this.db.data.settings = { ...newSettings, updated_at: serverTime };
        }
      }
      
      // Categories with conflict detection
      if (data.categories) {
        for (const category of data.categories) {
          const existingIndex = this.db.data.categories.findIndex(c => c.id === category.id);
          
          if (existingIndex >= 0) {
            const existing = this.db.data.categories[existingIndex];
            if (existing.updated_at > category.updated_at) {
              conflicts.push({
                type: 'category',
                id: category.id,
                reason: 'server_newer',
                clientTime: category.updated_at,
                serverTime: existing.updated_at,
              });
            } else {
              this.db.data.categories[existingIndex] = { ...category, updated_at: serverTime };
            }
          } else {
            this.db.data.categories.push({ ...category, updated_at: serverTime });
          }
        }
      }
      
      // Transactions with conflict detection
      if (data.transactions) {
        for (const transaction of data.transactions) {
          const existingIndex = this.db.data.transactions.findIndex(t => t.id === transaction.id);
          
          if (existingIndex >= 0) {
            const existing = this.db.data.transactions[existingIndex];
            if (existing.updated_at > transaction.updated_at) {
              conflicts.push({
                type: 'transaction',
                id: transaction.id,
                reason: 'server_newer',
                clientTime: transaction.updated_at,
                serverTime: existing.updated_at,
              });
            } else {
              this.db.data.transactions[existingIndex] = { ...transaction, updated_at: serverTime };
            }
          } else {
            this.db.data.transactions.push({ ...transaction, updated_at: serverTime });
          }
        }
      }
      
      // Similar for budgets and goals...
      if (data.budgets) {
        for (const budget of data.budgets) {
          const existingIndex = this.db.data.budgets.findIndex(b => b.id === budget.id);
          
          if (existingIndex >= 0) {
            const existing = this.db.data.budgets[existingIndex];
            if (existing.updated_at <= budget.updated_at) {
              this.db.data.budgets[existingIndex] = { ...budget, updated_at: serverTime };
            }
          } else {
            this.db.data.budgets.push({ ...budget, updated_at: serverTime });
          }
        }
      }
      
      if (data.goals) {
        for (const goal of data.goals) {
          const existingIndex = this.db.data.goals.findIndex(g => g.id === goal.id);
          
          if (existingIndex >= 0) {
            const existing = this.db.data.goals[existingIndex];
            if (existing.updated_at <= goal.updated_at) {
              this.db.data.goals[existingIndex] = { ...goal, updated_at: serverTime };
            }
          } else {
            this.db.data.goals.push({ ...goal, updated_at: serverTime });
          }
        }
      }
      
      this._updateMetadata();
      
      return { serverTime, conflicts };
    });
  }

  // Get data changes since timestamp for sync
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

  // Health check
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metadata: DatabaseSchema['_metadata'];
    stats: {
      settings: number;
      categories: number;
      transactions: number;
      budgets: number;
      goals: number;
    };
  }> {
    await this.init();
    
    return {
      status: 'healthy', // Could add more sophisticated health checks
      metadata: this.db.data._metadata,
      stats: {
        settings: this.db.data.settings ? 1 : 0,
        categories: this.db.data.categories.filter(c => !c.deleted).length,
        transactions: this.db.data.transactions.filter(t => !t.deleted).length,
        budgets: this.db.data.budgets.filter(b => !b.deleted).length,
        goals: this.db.data.goals.filter(g => !g.deleted).length,
      },
    };
  }
}

// Export singleton instance
export const atomicDb = new AtomicDatabase();