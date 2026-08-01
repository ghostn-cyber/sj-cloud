class IdentityRegistry {
  constructor() {
    this.identities = new Map();
  }

  register(serviceId, identity) {
    this.identities.set(serviceId, identity);
  }

  get(serviceId) {
    return this.identities.get(serviceId) || null;
  }

  has(serviceId) {
    return this.identities.has(serviceId);
  }

  getAll() {
    return Array.from(this.identities.values());
  }

  clear() {
    this.identities.clear();
  }
}

const globalIdentityRegistry = new IdentityRegistry();

module.exports = {
  IdentityRegistry,
  globalIdentityRegistry
};
