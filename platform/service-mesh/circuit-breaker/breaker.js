const { globalMetrics } = require('../telemetry/metrics');
const { globalEventDispatcher } = require('../events');

class CircuitBreaker {
  constructor(serviceId, config = {}) {
    this.serviceId = serviceId;
    this.failureThreshold = config.failure_threshold || 5;
    this.recoveryTimeoutMs = config.recovery_timeout_ms || 10000;
    this.halfOpenMaxRequests = config.half_open_max_requests || 2;

    this.state = 'Closed'; // 'Closed', 'Open', 'Half-Open'
    this.failureCount = 0;
    this.successCount = 0;
    this.lastStateTransition = Date.now();
    
    globalMetrics.recordCircuitBreakerState(this.serviceId, this.state);
  }

  updateConfig(config) {
    this.failureThreshold = config.failure_threshold || this.failureThreshold;
    this.recoveryTimeoutMs = config.recovery_timeout_ms || this.recoveryTimeoutMs;
    this.halfOpenMaxRequests = config.half_open_max_requests || this.halfOpenMaxRequests;
  }

  /**
   * Determine if a request is allowed to pass
   * @returns {boolean}
   */
  allowRequest() {
    this.checkRecovery();

    if (this.state === 'Open') {
      return false;
    }

    if (this.state === 'Half-Open') {
      return this.successCount < this.halfOpenMaxRequests;
    }

    return true;
  }

  /**
   * Transition state if recovery timeout elapsed
   */
  checkRecovery() {
    if (this.state === 'Open' && (Date.now() - this.lastStateTransition > this.recoveryTimeoutMs)) {
      this.transitionTo('Half-Open');
    }
  }

  /**
   * Record a successful request
   */
  recordSuccess() {
    globalMetrics.recordCircuitBreakerSuccess(this.serviceId);
    if (this.state === 'Half-Open') {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxRequests) {
        this.transitionTo('Closed');
      }
    } else if (this.state === 'Closed') {
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed request
   */
  recordFailure() {
    globalMetrics.recordCircuitBreakerFailure(this.serviceId);
    this.failureCount++;
    
    if (this.state === 'Closed') {
      if (this.failureCount >= this.failureThreshold) {
        this.transitionTo('Open');
      }
    } else if (this.state === 'Half-Open') {
      this.transitionTo('Open');
    }
  }

  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.lastStateTransition = Date.now();
    
    console.log(`Circuit Breaker [${this.serviceId}]: Transited from ${oldState} to ${newState}`);
    
    globalMetrics.recordCircuitBreakerState(this.serviceId, newState);
    if (newState === 'Open') {
      globalMetrics.recordCircuitBreakerTrip(this.serviceId);
      globalEventDispatcher.dispatchCircuitOpened(this.serviceId);
    } else if (newState === 'Closed') {
      globalEventDispatcher.dispatchCircuitClosed(this.serviceId);
    } else if (newState === 'Half-Open') {
      globalEventDispatcher.dispatchCircuitHalfOpen(this.serviceId);
    }

    this.successCount = 0;
    if (newState === 'Closed') {
      this.failureCount = 0;
    }
  }
}

class CircuitBreakerManager {
  constructor() {
    this.breakers = {};
  }

  /**
   * Get or create a circuit breaker for a service
   * @param {string} serviceId
   * @param {Object} policy Circuit breaker policy from config
   * @returns {CircuitBreaker}
   */
  getBreaker(serviceId, policy) {
    if (!this.breakers[serviceId]) {
      this.breakers[serviceId] = new CircuitBreaker(serviceId, policy);
    } else if (policy) {
      this.breakers[serviceId].updateConfig(policy);
    }
    return this.breakers[serviceId];
  }
}

const globalBreakerManager = new CircuitBreakerManager();

module.exports = {
  CircuitBreaker,
  globalBreakerManager
};
