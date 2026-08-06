const fs = require('fs');
const path = require('path');
const { globalEventBus } = require('../../service-mesh/events');

class CacheManager {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../../tenants');
  }

  getCacheDir(tenantId, appId, cacheKey) {
    return path.join(this.tenantsDir, tenantId, 'cache', appId, cacheKey);
  }

  restoreCache(tenantId, appId, cacheKey, targetPath) {
    const cacheDir = this.getCacheDir(tenantId, appId, cacheKey);
    if (!fs.existsSync(cacheDir)) {
      globalEventBus.publish('CacheMissed', { tenantId, appId, cacheKey, timestamp: Date.now() });
      return false;
    }

    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    // Emulate copying cache directories
    globalEventBus.publish('CacheRestored', { tenantId, appId, cacheKey, timestamp: Date.now() });
    return true;
  }

  saveCache(tenantId, appId, cacheKey, sourcePath) {
    if (!fs.existsSync(sourcePath)) return false;
    const cacheDir = this.getCacheDir(tenantId, appId, cacheKey);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    // Emulate archiving/saving cache
    globalEventBus.publish('CacheSaved', { tenantId, appId, cacheKey, timestamp: Date.now() });
    return true;
  }
}

const globalCacheManager = new CacheManager();

module.exports = {
  CacheManager,
  globalCacheManager
};
