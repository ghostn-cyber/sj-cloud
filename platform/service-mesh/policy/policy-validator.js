const { PolicyError } = require('../../shared/errors');

class PolicyValidator {
  static validate(policies) {
    if (!policies) {
      throw new PolicyError('Policies object is null or undefined');
    }

    if (policies.timeouts) {
      const { connect_ms, read_ms, write_ms, request_ms } = policies.timeouts;
      if (connect_ms < 0 || read_ms < 0 || write_ms < 0 || request_ms < 0) {
        throw new PolicyError('Timeout policies must be positive integers');
      }
    }

    if (policies.retry) {
      const { type, max_attempts, base_delay_ms } = policies.retry;
      const validTypes = ['immediate', 'linear', 'exponential', 'exponential_jitter', 'exponential_backoff'];
      if (!validTypes.includes(type)) {
        throw new PolicyError(`Invalid retry backoff type: ${type}`);
      }
      if (max_attempts < 0 || base_delay_ms < 0) {
        throw new PolicyError('Retry backoff attempts and delay must be positive');
      }
    }

    if (policies.circuit_breaker) {
      const { failure_threshold, recovery_timeout_ms, half_open_max_requests } = policies.circuit_breaker;
      if (failure_threshold < 1 || recovery_timeout_ms < 0 || half_open_max_requests < 1) {
        throw new PolicyError('Invalid circuit breaker policy parameters');
      }
    }

    return true;
  }
}

module.exports = PolicyValidator;
