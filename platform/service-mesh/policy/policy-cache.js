class PolicyCache {
  constructor() {
    this.cache = {};
  }

  get(serviceId) {
    return this.cache[serviceId] || null;
  }

  set(serviceId, policy) {
    this.cache[serviceId] = policy;
  }

  clear() {
    this.cache = {};
  }
}

module.exports = PolicyCache;
