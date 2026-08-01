const { States } = require('./runtime-state');
const { ValidationError } = require('../../../shared/errors');

class StateValidators {
  static isValidTransition(from, to) {
    const validMap = {
      [States.BOOTING]: [States.LOADING, States.FAILED],
      [States.LOADING]: [States.READY, States.FAILED],
      [States.READY]: [States.RELOADING, States.DEGRADED, States.STOPPING, States.FAILED],
      [States.RELOADING]: [States.READY, States.DEGRADED, States.FAILED],
      [States.DEGRADED]: [States.RECOVERING, States.READY, States.FAILED, States.STOPPING],
      [States.RECOVERING]: [States.READY, States.DEGRADED, States.FAILED],
      [States.FAILED]: [States.RECOVERING, States.STOPPING, States.STOPPED],
      [States.STOPPING]: [States.STOPPED],
      [States.STOPPED]: [States.BOOTING, States.LOADING]
    };

    const allowed = validMap[from] || [];
    return allowed.includes(to);
  }

  static validateTransition(from, to) {
    if (!this.isValidTransition(from, to)) {
      throw new ValidationError(`Invalid state transition from "${from}" to "${to}"`);
    }
    return true;
  }
}

module.exports = StateValidators;
