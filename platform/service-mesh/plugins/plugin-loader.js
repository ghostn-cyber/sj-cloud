const path = require('path');

class PluginLoader {
  static load(pluginPath) {
    try {
      const ResolvedPlugin = require(pluginPath);
      if (typeof ResolvedPlugin === 'function') {
        return new ResolvedPlugin();
      }
      return ResolvedPlugin;
    } catch (err) {
      throw new Error(`Failed to load plugin at ${pluginPath}: ${err.message}`);
    }
  }
}

module.exports = PluginLoader;
