class PluginRegistry {
  constructor() {
    this.plugins = new Map();
  }

  register(pluginId, pluginInstance, lifecycle) {
    this.plugins.set(pluginId, {
      instance: pluginInstance,
      lifecycle
    });
  }

  get(pluginId) {
    return this.plugins.get(pluginId) || null;
  }

  has(pluginId) {
    return this.plugins.has(pluginId);
  }

  getPlugins() {
    return Array.from(this.plugins.values());
  }

  clear() {
    this.plugins.clear();
  }
}

module.exports = PluginRegistry;
