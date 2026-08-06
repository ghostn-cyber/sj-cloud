class PipelineCache {
  constructor() {
    this.cache = new Map();
  }

  set(id, config) {
    this.cache.set(id, config);
  }

  get(id) {
    return this.cache.get(id);
  }

  delete(id) {
    this.cache.delete(id);
  }

  clear() {
    this.cache.clear();
  }

  getAll() {
    return Array.from(this.cache.values());
  }
}

module.exports = {
  PipelineCache
};
