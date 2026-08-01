const { PluginError } = require('../../shared/errors');

class PluginLoadError extends PluginError {
  constructor(message, details = null) {
    super(message, { error_code: 'PLUGIN_LOAD_ERROR', details });
  }
}

class PluginInitError extends PluginError {
  constructor(message, details = null) {
    super(message, { error_code: 'PLUGIN_INIT_ERROR', details });
  }
}

class PluginExecutionError extends PluginError {
  constructor(message, details = null) {
    super(message, { error_code: 'PLUGIN_EXECUTION_ERROR', details });
  }
}

module.exports = {
  PluginLoadError,
  PluginInitError,
  PluginExecutionError
};
