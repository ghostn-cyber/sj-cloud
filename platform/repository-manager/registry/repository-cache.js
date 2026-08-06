class RepositoryCache {
  constructor() {
    this.cache = new Map();
  }

  set(id, repo) {
    this.cache.set(id, repo);
  }

  get(id) {
    return this.cache.get(id);
  }

  getAll() {
    return Array.from(this.cache.values());
  }

  delete(id) {
    this.cache.delete(id);
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = {
  RepositoryCache
};
