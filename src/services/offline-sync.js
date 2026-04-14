// src/services/offline-sync.js
// Offline-First PWA Sync service

class OfflineSyncService {
  constructor() {
    this.syncQueue = new Map();
    this.offlineData = new Map();
  }

  /**
   * Queue data for sync when online
   * @param {object} data - Data to sync
   * @returns {string} Queue ID
   */
  queueForSync(data) {
    const queueId = 'queue-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    
    this.syncQueue.set(queueId, {
      id: queueId,
      data: data,
      queuedAt: new Date().toISOString(),
      status: 'pending'
    });
    
    console.log(`Data queued for sync: ${queueId}`);
    return queueId;
  }

  /**
   * Process sync queue
   * @returns {object} Sync results
   */
  processSyncQueue() {
    const pendingItems = Array.from(this.syncQueue.values())
      .filter(item => item.status === 'pending');
    
    // In a real implementation, this would actually sync the data
    // For now, we'll simulate the process
    const results = {
      processed: pendingItems.length,
      success: pendingItems.length,
      failed: 0,
      timestamp: new Date().toISOString()
    };
    
    // Mark items as synced
    pendingItems.forEach(item => {
      item.status = 'synced';
      this.syncQueue.set(item.id, item);
    });
    
    return results;
  }

  /**
   * Store data for offline access
   * @param {string} key - Data key
   * @param {object} data - Data to store
   * @returns {boolean} Storage result
   */
  storeOffline(key, data) {
    this.offlineData.set(key, {
      data: data,
      storedAt: new Date().toISOString()
    });
    
    return true;
  }

  /**
   * Retrieve offline data
   * @param {string} key - Data key
   * @returns {object} Retrieved data
   */
  getOfflineData(key) {
    return this.offlineData.get(key);
  }

  /**
   * Get sync queue status
   * @returns {object} Queue status
   */
  getQueueStatus() {
    return {
      totalItems: this.syncQueue.size,
      pendingItems: Array.from(this.syncQueue.values())
        .filter(item => item.status === 'pending').length,
      syncedItems: Array.from(this.syncQueue.values())
        .filter(item => item.status === 'synced').length
    };
  }
}

module.exports = OfflineSyncService;