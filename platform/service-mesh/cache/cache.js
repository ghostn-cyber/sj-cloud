const fs = require('fs');
const path = require('path');
const { globalMetrics } = require('../observability/metrics');

class RuntimeCache {
  /**
   * @param {string} snapshotPath Absolute path to snapshot.json
   */
  constructor(snapshotPath) {
    this.snapshotPath = snapshotPath;
    this.services = {};
    this.compiledAt = null;
    this.watcher = null;
    this.listeners = [];
  }

  load() {
    if (!fs.existsSync(this.snapshotPath)) {
      console.warn(`Runtime Cache: Snapshot file not found at ${this.snapshotPath}. Waiting for compilation...`);
      globalMetrics.recordCacheMiss();
      return;
    }

    try {
      const content = fs.readFileSync(this.snapshotPath, 'utf8');
      const snapshot = JSON.parse(content);
      this.services = snapshot.services || {};
      this.compiledAt = snapshot.compiledAt;
      console.log(`Runtime Cache: Successfully loaded ${Object.keys(this.services).length} service(s) from snapshot.`);
      
      globalMetrics.recordSnapshotReload();
      globalMetrics.setSnapshotInfo(snapshot.buildNumber || 1, Date.parse(this.compiledAt) || Date.now());
      globalMetrics.setActiveServicesCount(Object.keys(this.services).length);
      globalMetrics.recordCacheHit();

      for (const listener of this.listeners) {
        try {
          listener(this.services);
        } catch (err) {
          console.error('Runtime Cache: Listener callback error:', err);
        }
      }
    } catch (err) {
      console.error(`Runtime Cache: Failed to load snapshot at ${this.snapshotPath}: ${err.message}`);
      globalMetrics.recordCacheMiss();
    }
  }

  startWatching() {
    if (this.watcher) return;

    const dir = path.dirname(this.snapshotPath);
    const file = path.basename(this.snapshotPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let timeout = null;
    this.watcher = fs.watch(dir, (eventType, filename) => {
      if (filename === file) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.load();
        }, 100);
      }
    });
    
    this.load();
  }

  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  getService(serviceId) {
    const service = this.services[serviceId];
    if (service) {
      globalMetrics.recordCacheHit();
    } else {
      globalMetrics.recordCacheMiss();
    }
    return service;
  }

  getAllServices() {
    return this.services;
  }

  onReload(callback) {
    this.listeners.push(callback);
  }
}

module.exports = {
  RuntimeCache
};
