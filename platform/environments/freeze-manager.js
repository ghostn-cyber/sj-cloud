class FreezeManager {
  constructor() {
    this.frozenEnvironments = new Set();
  }

  freeze(envName) {
    this.frozenEnvironments.add(envName.toLowerCase());
    return true;
  }

  unfreeze(envName) {
    this.frozenEnvironments.delete(envName.toLowerCase());
    return true;
  }

  isFrozen(envName) {
    return this.frozenEnvironments.has(envName.toLowerCase());
  }
}

const globalFreezeManager = new FreezeManager();

module.exports = {
  FreezeManager,
  globalFreezeManager
};
