const IncidentStates = {
  OPEN: 'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  INVESTIGATING: 'INVESTIGATING',
  MITIGATED: 'MITIGATED',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

const AllowedTransitions = {
  [IncidentStates.OPEN]: [IncidentStates.ACKNOWLEDGED, IncidentStates.RESOLVED, IncidentStates.CLOSED],
  [IncidentStates.ACKNOWLEDGED]: [IncidentStates.INVESTIGATING, IncidentStates.RESOLVED, IncidentStates.CLOSED],
  [IncidentStates.INVESTIGATING]: [IncidentStates.MITIGATED, IncidentStates.RESOLVED, IncidentStates.CLOSED],
  [IncidentStates.MITIGATED]: [IncidentStates.RESOLVED, IncidentStates.CLOSED],
  [IncidentStates.RESOLVED]: [IncidentStates.CLOSED],
  [IncidentStates.CLOSED]: []
};

class IncidentStateMachine {
  constructor(currentState = IncidentStates.OPEN) {
    this.state = currentState;
  }

  transitionTo(nextState) {
    const allowed = AllowedTransitions[this.state] || [];
    if (!allowed.includes(nextState)) {
      throw new Error(`Invalid incident transition from ${this.state} to ${nextState}`);
    }
    this.state = nextState;
    return this.state;
  }

  getState() {
    return this.state;
  }
}

module.exports = {
  IncidentStates,
  IncidentStateMachine
};
