class ArtifactCache {
  constructor() {
    this.cache = new Map();
  }

  set(id, artifact) {
    this.cache.set(id, artifact);
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
  ArtifactCache
};
