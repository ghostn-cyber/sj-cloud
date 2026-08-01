const { DeploymentStates } = require('./deployment-state');

const VALID_TRANSITIONS = {
  [DeploymentStates.CREATED]: [
    DeploymentStates.BUILDING,
    DeploymentStates.DEPLOYING,
    DeploymentStates.FAILED,
    DeploymentStates.ARCHIVED
  ],
  [DeploymentStates.BUILDING]: [
    DeploymentStates.BUILT,
    DeploymentStates.FAILED
  ],
  [DeploymentStates.BUILT]: [
    DeploymentStates.DEPLOYING,
    DeploymentStates.FAILED,
    DeploymentStates.ARCHIVED
  ],
  [DeploymentStates.DEPLOYING]: [
    DeploymentStates.VERIFYING,
    DeploymentStates.FAILED,
    DeploymentStates.ROLLBACK
  ],
  [DeploymentStates.VERIFYING]: [
    DeploymentStates.ACTIVE,
    DeploymentStates.FAILED
  ],
  [DeploymentStates.ACTIVE]: [
    DeploymentStates.UPDATING,
    DeploymentStates.SCALING,
    DeploymentStates.FAILED,
    DeploymentStates.ARCHIVED,
    DeploymentStates.ROLLBACK
  ],
  [DeploymentStates.SCALING]: [
    DeploymentStates.ACTIVE,
    DeploymentStates.FAILED
  ],
  [DeploymentStates.UPDATING]: [
    DeploymentStates.VERIFYING,
    DeploymentStates.FAILED
  ],
  [DeploymentStates.FAILED]: [
    DeploymentStates.ROLLBACK,
    DeploymentStates.BUILDING,
    DeploymentStates.DEPLOYING,
    DeploymentStates.ARCHIVED
  ],
  [DeploymentStates.ROLLBACK]: [
    DeploymentStates.VERIFYING,
    DeploymentStates.FAILED,
    DeploymentStates.ACTIVE
  ],
  [DeploymentStates.ARCHIVED]: [
    DeploymentStates.CREATED
  ]
};

function isValidTransition(fromState, toState) {
  if (!fromState) return true; // Initial creation is allowed
  const allowed = VALID_TRANSITIONS[fromState];
  return allowed ? allowed.includes(toState) : false;
}

module.exports = {
  isValidTransition
};
