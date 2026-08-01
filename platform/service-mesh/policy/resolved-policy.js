class ResolvedPolicy {
  constructor(data) {
    this.timeouts = data.timeouts || {};
    this.retry = data.retry || {};
    this.circuit_breaker = data.circuit_breaker || {};
    this.load_balancer = data.load_balancer || {};
    this.security = data.security || {};
  }

  toJSON() {
    return {
      timeouts: this.timeouts,
      retry: this.retry,
      circuit_breaker: this.circuit_breaker,
      load_balancer: this.load_balancer,
      security: this.security
    };
  }
}

module.exports = ResolvedPolicy;
