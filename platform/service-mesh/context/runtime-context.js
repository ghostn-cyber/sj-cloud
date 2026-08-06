class RuntimeContext {
  /**
   * @param {Object} params Initial context parameters
   */
  constructor(params = {}) {
    // 1. Tenant Context
    this.tenant = {
      tenantId: params.tenantId || 'system',
      domain: params.domain || 'sj-cloud.test',
      metadata: params.tenantMetadata || {}
    };

    // 2. Service Context
    this.service = {
      requestId: params.requestId || `req-${Math.random().toString(36).substr(2, 9)}`,
      correlationId: params.correlationId || params.requestId || `corr-${Math.random().toString(36).substr(2, 9)}`,
      sourceService: params.sourceService || 'api-gateway',
      destinationService: params.destinationService || 'unknown'
    };

    // 3. Policy Context (Extracted from compiled service schema policies)
    this.policies = {
      routing: params.routingPolicy || {},
      timeout: params.timeoutPolicy || {
        connect_ms: 1500,
        read_ms: 5000,
        write_ms: 5000,
        request_ms: 8000
      },
      retry: params.retryPolicy || {
        type: 'exponential_backoff',
        max_attempts: 3,
        base_delay_ms: 100,
        max_delay_ms: 2000
      },
      circuitBreaker: params.circuitBreakerPolicy || {
        failure_threshold: 5,
        recovery_timeout_ms: 10000,
        half_open_max_requests: 2
      },
      security: params.securityPolicy || {
        tls_required: false,
        allowed_sources: []
      },
      loadBalancer: params.loadBalancerPolicy || {
        strategy: 'round_robin'
      }
    };

    // 4. Tracing Context (OpenTelemetry compatible)
    this.tracing = {
      traceId: params.traceId || '',
      spanId: params.spanId || '',
      parentSpanId: params.parentSpanId || ''
    };

    // 5. Observability Context (Metrics markers)
    this.observability = {
      startTime: Date.now(),
      attempts: 0,
      failures: [],
      circuitBreakerTripped: false,
      timeoutEnforced: false,
      targetInstance: ''
    };
  }

  /**
   * Export context as HTTP headers to propagate down the request chain
   * @returns {Object} HTTP headers map
   */
  toHeaders() {
    const headers = {
      'x-request-id': this.service.requestId,
      'x-correlation-id': this.service.correlationId,
      'x-tenant-id': this.tenant.tenantId,
      'x-source-service': this.service.sourceService,
      'x-destination-service': this.service.destinationService
    };

    // OpenTelemetry Traceparent header format:
    // 00-{traceId}-{spanId}-{traceFlags}
    if (this.tracing.traceId && this.tracing.spanId) {
      headers['traceparent'] = `00-${this.tracing.traceId}-${this.tracing.spanId}-01`;
    }

    return headers;
  }

  /**
   * Create a child runtime context for downstream spans
   * @param {string} nextSpanId The span ID for the next hop
   */
  createChild(nextSpanId) {
    return new RuntimeContext({
      tenantId: this.tenant.tenantId,
      domain: this.tenant.domain,
      tenantMetadata: this.tenant.metadata,
      requestId: this.service.requestId,
      correlationId: this.service.correlationId,
      sourceService: this.service.sourceService,
      destinationService: this.service.destinationService,
      routingPolicy: this.policies.routing,
      timeoutPolicy: this.policies.timeout,
      retryPolicy: this.policies.retry,
      circuitBreakerPolicy: this.policies.circuitBreaker,
      securityPolicy: this.policies.security,
      loadBalancerPolicy: this.policies.loadBalancer,
      traceId: this.tracing.traceId,
      spanId: nextSpanId,
      parentSpanId: this.tracing.spanId
    });
  }
}

module.exports = {
  RuntimeContext
};
