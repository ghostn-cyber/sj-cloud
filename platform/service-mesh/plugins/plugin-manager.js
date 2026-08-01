const PluginRegistry = require('./plugin-registry');
const { PluginLifecycle, PluginStates } = require('./plugin-lifecycle');
const { PluginLoadError, PluginInitError, PluginExecutionError } = require('./plugin-errors');

class PluginManager {
  constructor() {
    this.registry = new PluginRegistry();
  }

  loadPlugin(pluginId, pluginPathOrInstance) {
    try {
      let instance = pluginPathOrInstance;
      if (typeof pluginPathOrInstance === 'string') {
        instance = require(pluginPathOrInstance);
      }

      const lifecycle = new PluginLifecycle(pluginId);
      lifecycle.transitionTo(PluginStates.LOADED);
      this.registry.register(pluginId, instance, lifecycle);
    } catch (err) {
      throw new PluginLoadError(`Failed to load plugin "${pluginId}": ${err.message}`, err);
    }
  }

  async initializePlugin(pluginId, config = {}) {
    const plugin = this.registry.get(pluginId);
    if (!plugin) {
      throw new PluginInitError(`Plugin "${pluginId}" not found for initialization`);
    }

    try {
      if (plugin.instance.initialize) {
        await plugin.instance.initialize(config);
      }
      plugin.lifecycle.transitionTo(PluginStates.INITIALIZED);
      plugin.lifecycle.transitionTo(PluginStates.ACTIVE);
    } catch (err) {
      plugin.lifecycle.transitionTo(PluginStates.FAILED);
      throw new PluginInitError(`Failed to initialize plugin "${pluginId}": ${err.message}`, err);
    }
  }

  async executeHook(hookName, ...args) {
    const plugins = this.registry.getPlugins();
    for (const plugin of plugins) {
      if (plugin.lifecycle.getState() !== PluginStates.ACTIVE) continue;

      if (plugin.instance && typeof plugin.instance[hookName] === 'function') {
        try {
          await plugin.instance[hookName](...args);
        } catch (err) {
          console.error(`Error executing hook "${hookName}" on plugin "${plugin.lifecycle.pluginId}":`, err.message);
          throw new PluginExecutionError(`Plugin "${plugin.lifecycle.pluginId}" failed on hook "${hookName}": ${err.message}`, err);
        }
      }
    }
  }
}

const globalPluginManager = new PluginManager();

module.exports = {
  PluginManager,
  globalPluginManager
};
