const StateValidators = require('./state-validators');
const StateEvents = require('./state-events');
const { globalMetrics } = require('../../observability/metrics');

class TransitionManager {
  static transition(stateMachine, newState) {
    const oldState = stateMachine.state;
    if (oldState === newState) return;

    StateValidators.validateTransition(oldState, newState);

    stateMachine.state = newState;
    console.log(`Runtime FSM: Transited from ${oldState} to ${newState}`);

    if (globalMetrics && typeof globalMetrics.recordStateTransition === 'function') {
      globalMetrics.recordStateTransition(oldState, newState);
    }

    StateEvents.emitTransition(oldState, newState);
  }
}

module.exports = TransitionManager;
