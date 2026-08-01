const { globalEventDispatcher } = require('../events');

const States = {
  LOADING: 'Loading',
  VALIDATING: 'Validating',
  READY: 'Ready',
  RELOADING: 'Reloading',
  RECOVERING: 'Recovering',
  FAILED: 'Failed',
  STOPPED: 'Stopped'
};

class StateMachine {
  constructor(initialState = States.LOADING) {
    this.state = initialState;
  }

  transitionTo(newState) {
    const oldState = this.state;
    if (oldState === newState) return;

    this.state = newState;
    console.log(`Runtime FSM: Transited from ${oldState} to ${newState}`);
    
    globalEventDispatcher.dispatch('RUNTIME_STATE_CHANGED', {
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
  StateMachine,
  States
};
