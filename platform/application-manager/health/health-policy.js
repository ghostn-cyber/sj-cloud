class HealthPolicy {
  constructor(options = {}) {
    this.initialDelay = options.initial_delay || 2;
    this.interval = options.interval || 5;
    this.threshold = options.threshold || 3;
  }

  isFailureLimitReached(consecutiveFailures) {
    return consecutiveFailures >= this.threshold;
  }
}

module.exports = { HealthPolicy };
