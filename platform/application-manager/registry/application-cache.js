class ApplicationCache {
  constructor() {
    this.cache = new Map();
  }

  set(appId, config) {
    this.cache.set(appId, JSON.parse(JSON.stringify(config)));
  }

  get(appId) {
    const config = this.cache.get(appId);
    return config ? JSON.parse(JSON.stringify(config)) : null;
  }

  delete(appId) {
    this.cache.delete(appId);
  }

  clear() {
    this.cache.clear();
  }

  getAll() {
    return Array.from(this.cache.values()).map(c => JSON.parse(JSON.stringify(c)));
  }
}

module.exports = { ApplicationCache };
