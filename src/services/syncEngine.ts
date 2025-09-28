// NOTE: Sync engine is currently disabled as we're using offline-first Dexie approach
// This file is kept for future server sync implementation

import { apiClient, ApiError } from './api';
import { SyncRequest } from '@/lib/types';

// Temporary type definitions for when sync is re-enabled
interface OutboxItem {
  id: string;
  entity: string;
  operation: string;
  payload: any;
  created_at: number;
  synced: boolean;
  retry_count: number;
}

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
    // Sync is currently disabled for offline-first approach
    console.warn('[Sync] Sync functionality is currently disabled - app runs in offline-first mode');
    return { 
      success: false, 
      error: 'Sync disabled in offline-first mode', 
      itemsSynced: 0, 
      itemsPulled: 0, 
      lastSync: Date.now() 
    };

    /* TODO: Re-enable when implementing server sync
    if (this.isSyncing) {
      return { success: false, error: 'Sync already in progress', itemsSynced: 0, itemsPulled: 0, lastSync: 0 };
    }

    if (!navigator.onLine) {
      console.log('[Sync] Skipped - device is offline');
      return { success: false, error: 'Offline', itemsSynced: 0, itemsPulled: 0, lastSync: 0 };
    }

    // Quick server availability check
    try {
      await apiClient.health();
    } catch (error) {
      console.warn('[Sync] Server unavailable, operating in offline mode');
      return { success: false, error: 'Server unavailable', itemsSynced: 0, itemsPulled: 0, lastSync: 0 };
    }

    const { maxRetries = 3 } = options;
    this.isSyncing = true;

    try {
      const syncState = await db.getSyncState();
      const unsyncedItems = await db.getUnsyncedItems();
      
      // Filter out items that have exceeded retry limit
      const itemsToSync = unsyncedItems.filter(item => item.retry_count < maxRetries);
      
      if (itemsToSync.length === 0 && !options.force) {
        // Still do a pull to get server changes
        return await this.pullFromServer(syncState.last_sync);
      }

      // Prepare sync request
      const syncRequest: SyncRequest = {
        client_id: syncState.client_id,
        since: syncState.last_sync,
        push: this.groupItemsByEntity(itemsToSync),
      };

      const syncSessionId = `sync-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      console.log(`[${syncSessionId}] Starting sync session:`, {
        clientId: syncState.client_id,
        outboxItems: itemsToSync.length,
        since: new Date(syncState.last_sync).toISOString(),
        force: options.force || false,
        maxRetries: maxRetries
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
        last_sync: response.server_time,
        last_full_sync: response.server_time,
      });

      console.log(`[${syncSessionId}] Sync completed successfully:`, {
        itemsSynced: itemsToSync.length,
        itemsPulled,
        serverTime: new Date(response.server_time).toISOString(),
        duration: Date.now() - parseInt(syncSessionId.split('-')[1])
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
          if (item.retry_count < maxRetries) {
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
    */
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
    // Return dummy data since sync is disabled
    return {
      isSyncing: this.isSyncing,
      lastSync: 0,
      unsyncedItemsCount: 0,
      clientId: 'offline-client',
    };
  }

  // Clear all local data and resync
  async resetAndResync(): Promise<SyncResult> {
    // Return dummy result since sync is disabled
    return {
      success: false,
      error: 'Sync disabled in offline-first mode',
      itemsSynced: 0,
      itemsPulled: 0,
      lastSync: Date.now()
    };
  }

  /* TODO: Re-enable these methods when implementing server sync
  private async pullFromServer(since: number): Promise<SyncResult> {
    try {
      const syncState = await db.getSyncState();
      const syncRequest: SyncRequest = {
        client_id: syncState.client_id,
        since,
        push: {}, // Empty push
      };

      const response = await apiClient.sync(syncRequest);
      const itemsPulled = await this.applyServerChanges(response);

      await db.updateSyncState({
        last_sync: response.server_time,
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
      await db.bulkUpsert('settings', pull.settings);
      totalItems += pull.settings.length;
    }

    // Apply categories
    if (pull.categories?.length > 0) {
      await db.bulkUpsert('categories', pull.categories);
      totalItems += pull.categories.length;
    }

    // Apply transactions
    if (pull.transactions?.length > 0) {
      await db.bulkUpsert('transactions', pull.transactions);
      totalItems += pull.transactions.length;
    }

    // Apply budgets
    if (pull.budgets?.length > 0) {
      await db.bulkUpsert('budgets', pull.budgets);
      totalItems += pull.budgets.length;
    }

    // Apply goals
    if (pull.goals?.length > 0) {
      await db.bulkUpsert('goals', pull.goals);
      totalItems += pull.goals.length;
    }

    return totalItems;
  }
  */
}

// Export singleton instance
export const syncEngine = new SyncEngine();