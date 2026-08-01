const DefaultPolicy = {
  timeouts: {
    connect_ms: 1500,
    read_ms: 5000,
    write_ms: 5000,
    request_ms: 8000
  },
  retry: {
    type: 'exponential_backoff',
    max_attempts: 3,
    base_delay_ms: 100,
    max_delay_ms: 2000
  },
  circuit_breaker: {
    failure_threshold: 5,
    recovery_timeout_ms: 10000,
    half_open_max_requests: 2
  },
  load_balancer: {
    strategy: 'round_robin'
  },
  security: {
    tls_required: false,
    allowed_sources: []
  }
};

module.exports = DefaultPolicy;
