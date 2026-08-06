function deepFreeze(object) {
  const propNames = Reflect.ownKeys(object);
  for (const name of propNames) {
    const value = object[name];
    if ((value && typeof value === 'object') || typeof value === 'function') {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

class ConfigCache {
  constructor() {
    this.cachedConfig = null;
  }

  set(config) {
    this.cachedConfig = deepFreeze(Object.assign({}, config));
  }

  get() {
    return this.cachedConfig;
  }

  clear() {
    this.cachedConfig = null;
  }
}

const globalConfigCache = new ConfigCache();

module.exports = {
  ConfigCache,
  globalConfigCache
};
