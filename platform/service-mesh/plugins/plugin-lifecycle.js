const PluginStates = {
  UNLOADED: 'UNLOADED',
  LOADED: 'LOADED',
  INITIALIZED: 'INITIALIZED',
  ACTIVE: 'ACTIVE',
  FAILED: 'FAILED'
};

class PluginLifecycle {
  constructor(pluginId) {
    this.pluginId = pluginId;
    this.state = PluginStates.UNLOADED;
    this.transitionHistory = [];
  }

  transitionTo(newState) {
    const oldState = this.state;
    if (oldState === newState) return;
    this.state = newState;
    this.transitionHistory.push({
      from: oldState,
      to: newState,
      timestamp: Date.now()
    });
  }

  getState() {
    return this.state;
  }
}

module.exports = {
  PluginStates,
  PluginLifecycle
};
