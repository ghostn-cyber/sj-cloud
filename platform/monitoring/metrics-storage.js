class MetricsStorage {
  constructor() {
    this.values = new Map();
  }

  keyOf(name, labels = {}) {
    const sortedKeys = Object.keys(labels).sort();
    const parts = sortedKeys.map(k => `${k}="${labels[k]}"`);
    return parts.length > 0 ? `${name}{${parts.join(',')}}` : name;
  }

  set(name, value, labels = {}) {
    const key = this.keyOf(name, labels);
    this.values.set(key, { name, value, labels, timestamp: Date.now() });
  }

  get(name, labels = {}) {
    const key = this.keyOf(name, labels);
    return this.values.get(key);
  }

  increment(name, amount = 1, labels = {}) {
    const key = this.keyOf(name, labels);
    const existing = this.values.get(key);
    const currentVal = existing ? existing.value : 0;
    this.values.set(key, { name, value: currentVal + amount, labels, timestamp: Date.now() });
  }

  getAll() {
    return Array.from(this.values.values());
  }

  clear() {
    this.values.clear();
  }
}

const globalMetricsStorage = new MetricsStorage();

module.exports = {
  MetricsStorage,
  globalMetricsStorage
};
