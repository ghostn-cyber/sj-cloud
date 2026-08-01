class DeploymentPlan {
  static generate(strategy, appId, tenantId, release) {
    const steps = [];

    if (strategy === 'Recreate') {
      steps.push({
        name: 'STOP_OLD',
        action: 'stop'
      });
      steps.push({
        name: 'START_NEW',
        action: 'start',
        release
      });
    } else {
      // Default: Rolling
      steps.push({
        name: 'START_NEW',
        action: 'start',
        release
      });
      steps.push({
        name: 'VERIFY_READINESS',
        action: 'verify'
      });
      steps.push({
        name: 'STOP_OLD',
        action: 'stop_previous'
      });
    }

    return steps;
  }
}

module.exports = { DeploymentPlan };
