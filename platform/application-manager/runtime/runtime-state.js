class RuntimeState {
  constructor() {
    this.states = new Map();
  }

  set(appId, status) {
    this.states.set(appId, status);
  }

  get(appId) {
    return this.states.get(appId) || 'STOPPED';
  }
}

const globalRuntimeState = new RuntimeState();

module.exports = {
  RuntimeState,
  globalRuntimeState
};
