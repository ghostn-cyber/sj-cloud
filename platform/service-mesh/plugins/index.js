const { PluginManager, globalPluginManager } = require('./plugin-manager');
const PluginRegistry = require('./plugin-registry');
const { PluginStates, PluginLifecycle } = require('./plugin-lifecycle');
const { PluginHooks } = require('./plugin-types');
const pluginErrors = require('./plugin-errors');

module.exports = {
  PluginManager,
  globalPluginManager,
  PluginRegistry,
  PluginStates,
  PluginLifecycle,
  PluginHooks,
  ...pluginErrors
};
