const { globalEventDispatcher } = require('../../events');

class StateEvents {
  static emitTransition(from, to) {
    globalEventDispatcher.dispatch('RUNTIME_STATE_CHANGED', {
      from,
      to,
      timestamp: Date.now()
    });
  }
}

module.exports = StateEvents;
