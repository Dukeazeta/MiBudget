import { db, OutboxItem } from './database';
import { apiClient, ApiError } from './api';
import { SyncRequest } from '@mibudget/shared';

export interface SyncOptions {
  force?: boolean;
  maxRetries?: number;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  itemsSynced: number;
  itemsPulled: number;
  lastSync: number;
}

export class SyncEngine {
  private isSyncing = false;
  private syncInterval?: NodeJS.Timeout;
  private retryTimeout?: NodeJS.Timeout;

  // Start automatic syncing
  startAutoSync(intervalMs = 30000): void { // 30 seconds
    this.stopAutoSync();
    
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync({ maxRetries: 3 }).catch(console.error);
      }
    }, intervalMs);

    // Also sync on window focus
    window.addEventListener('focus', this.handleWindowFocus);
    window.addEventListener('online', this.handleOnline);
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
    
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }

    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('online', this.handleOnline);
  }

  private handleWindowFocus = (): void => {
    if (navigator.onLine && !this.isSyncing) {
      this.sync({ maxRetries: 1 }).catch(console.error);
    }
  };

  private handleOnline = (): void => {
    // Give a small delay to ensure network is ready
    setTimeout(() => {
      if (!this.isSyncing) {
        this.sync({ maxRetries: 3 }).catch(console.error);
      }
    }, 1000);
  };

  async sync(options: SyncOptions = {}): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress', itemsSynced: 0, itemsPulled: 0, lastSync: 0 };
    }

    if (!navigator.onLine) {
      return { success: false, error: 'Offline', itemsSynced: 0, itemsPulled: 0, lastSync: 0 };
    }

    this.isSyncing = true;
    const maxRetries = options.maxRetries ?? 3;

    try {
      const syncState = await db.getSyncState();
      const unsyncedItems = await db.getUnsyncedItems();
      
      // Filter out items that have exceeded retry limit
      const itemsToSync = unsyncedItems.filter(item => item.retryCount < maxRetries);
      
      if (itemsToSync.length === 0 && !options.force) {
        // Still do a pull to get server changes
        return await this.pullFromServer(syncState.lastSync);
      }

      // Prepare sync request
      const syncRequest: SyncRequest = {
        client_id: syncState.clientId,
        since: syncState.lastSync,
        push: this.groupItemsByEntity(itemsToSync),
      };

      console.log('Syncing with server:', {
        clientId: syncState.clientId,
        outboxItems: itemsToSync.length,
        since: syncState.lastSync,
      });

      // Send to server
      const response = await apiClient.sync(syncRequest);
      
      // Mark pushed items as synced
      if (itemsToSync.length > 0) {
        await db.markAsSynced(itemsToSync.map(item => item.id));
      }

      // Apply pulled changes
      const itemsPulled = await this.applyServerChanges(response);

      // Update sync state
      await db.updateSyncState({
        lastSync: response.server_time,
        lastFullSync: response.server_time,
      });

      console.log('Sync completed successfully:', {
        itemsSynced: itemsToSync.length,
        itemsPulled,
        serverTime: response.server_time,
      });

      return {
        success: true,
        itemsSynced: itemsToSync.length,
        itemsPulled,
        lastSync: response.server_time,
      };

    } catch (error) {
      console.error('Sync failed:', error);
      
      let errorMessage = 'Unknown sync error';
      if (error instanceof ApiError) {
        errorMessage = error.message;
        
        // Increment retry count for failed items
        const unsyncedItems = await db.getUnsyncedItems();
        for (const item of unsyncedItems) {
          if (item.retryCount < maxRetries) {
            await db.incrementRetryCount(item.id);
          }
        }

        // Schedule retry with exponential backoff
        if (maxRetries > 0) {
          const retryDelay = Math.min(30000, 1000 * Math.pow(2, maxRetries - 1)); // Max 30s
          this.scheduleRetry(retryDelay, { maxRetries: maxRetries - 1 });
        }
      }

      return {
        success: false,
        error: errorMessage,
        itemsSynced: 0,
        itemsPulled: 0,
        lastSync: 0,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  private async pullFromServer(since: number): Promise<SyncResult> {
    try {
      const syncState = await db.getSyncState();
      const syncRequest: SyncRequest = {
        client_id: syncState.clientId,
        since,
        push: {}, // Empty push
      };

      const response = await apiClient.sync(syncRequest);
      const itemsPulled = await this.applyServerChanges(response);

      await db.updateSyncState({
        lastSync: response.server_time,
      });

      return {
        success: true,
        itemsSynced: 0,
        itemsPulled,
        lastSync: response.server_time,
      };
    } catch (error) {
      console.error('Pull failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Pull failed',
        itemsSynced: 0,
        itemsPulled: 0,
        lastSync: 0,
      };
    }
  }

  private scheduleRetry(delayMs: number, options: SyncOptions): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.sync(options).catch(console.error);
      }
    }, delayMs);
  }

  private groupItemsByEntity(items: OutboxItem[]): SyncRequest['push'] {
    const grouped: SyncRequest['push'] = {};

    for (const item of items) {
      if (!grouped[item.entity]) {
        grouped[item.entity] = [];
      }
      grouped[item.entity]!.push(item.payload);
    }

    return grouped;
  }

  private async applyServerChanges(response: any): Promise<number> {
    let totalItems = 0;
    const { pull } = response;

    // Apply settings
    if (pull.settings?.length > 0) {
      await db.bulkUpsert(db.settings, pull.settings);
      totalItems += pull.settings.length;
    }

    // Apply categories
    if (pull.categories?.length > 0) {
      await db.bulkUpsert(db.categories, pull.categories);
      totalItems += pull.categories.length;
    }

    // Apply transactions
    if (pull.transactions?.length > 0) {
      await db.bulkUpsert(db.transactions, pull.transactions);
      totalItems += pull.transactions.length;
    }

    // Apply budgets
    if (pull.budgets?.length > 0) {
      await db.bulkUpsert(db.budgets, pull.budgets);
      totalItems += pull.budgets.length;
    }

    // Apply goals
    if (pull.goals?.length > 0) {
      await db.bulkUpsert(db.goals, pull.goals);
      totalItems += pull.goals.length;
    }

    return totalItems;
  }

  // Manual sync trigger
  async forcSync(): Promise<SyncResult> {
    return this.sync({ force: true, maxRetries: 5 });
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isSyncing: boolean;
    lastSync: number;
    unsyncedItemsCount: number;
    clientId: string;
  }> {
    const syncState = await db.getSyncState();
    const unsyncedItems = await db.getUnsyncedItems();

    return {
      isSyncing: this.isSyncing,
      lastSync: syncState.lastSync,
      unsyncedItemsCount: unsyncedItems.length,
      clientId: syncState.clientId,
    };
  }

  // Clear all local data and resync
  async resetAndResync(): Promise<SyncResult> {
    await db.clearAllData();
    
    // Initialize will recreate sync state with new client ID
    await db.open();
    
    return this.sync({ force: true, maxRetries: 5 });
  }
}

// Export singleton instance
export const syncEngine = new SyncEngine();