const { StateMachine } = require('./state/state-machine');
const { States } = require('./state/runtime-state');

class LifecycleManager {
  constructor() {
    this.fsm = new StateMachine(States.BOOTING);
  }

  async startup(initFunc) {
    this.fsm.transitionTo(States.LOADING);
    try {
      if (initFunc) await initFunc();
      this.fsm.transitionTo(States.READY);
    } catch (err) {
      console.error(`Runtime startup failed: ${err.message}`);
      this.fsm.transitionTo(States.FAILED);
      throw err;
    }
  }

  async reload(reloadFunc) {
    this.fsm.transitionTo(States.RELOADING);
    try {
      if (reloadFunc) await reloadFunc();
      this.fsm.transitionTo(States.READY);
    } catch (err) {
      console.error(`Runtime reload failed, attempting recovery: ${err.message}`);
      try {
        this.fsm.transitionTo(States.RECOVERING);
      } catch (_) {}
      this.fsm.transitionTo(States.FAILED);
      throw err;
    }
  }

  shutdown(cleanupFunc) {
    try {
      this.fsm.transitionTo(States.STOPPING);
    } catch (_) {}
    if (cleanupFunc) {
      try {
        cleanupFunc();
      } catch (_) {}
    }
    try {
      this.fsm.transitionTo(States.STOPPED);
    } catch (_) {}
  }
}

const globalLifecycleManager = new LifecycleManager();

module.exports = {
  LifecycleManager,
  globalLifecycleManager
};
