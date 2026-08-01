class DeploymentContext {
  constructor(strategy, replicas, variables) {
    this.strategy = strategy || 'Rolling';
    this.replicas = replicas || 1;
    this.variables = Object.freeze({ ...(variables || {}) });
    Object.freeze(this);
  }
}

module.exports = { DeploymentContext };
