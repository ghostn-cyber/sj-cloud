const { States } = require('./runtime-state');
const TransitionManager = require('./transition-manager');
const RuntimeStatus = require('./runtime-status');

class StateMachine {
  constructor(initialState = States.BOOTING) {
    this.state = initialState;
    this.status = new RuntimeStatus();
  }

  transitionTo(newState) {
    TransitionManager.transition(this, newState);
  }

  getState() {
    return this.state;
  }

  getStatus() {
    return this.status.getDetails(this.state);
  }
}

module.exports = {
  StateMachine,
  States
};
