const CoreCapabilities = {
  RETRY: 'Retry',
  CIRCUIT_BREAKER: 'Circuit Breaker',
  METRICS: 'Metrics',
  TRACING: 'Tracing',
  TLS: 'TLS',
  COMPRESSION: 'Compression',
  AUTHENTICATION: 'Authentication',
  CACHE: 'Cache',
  ROUTING: 'Routing'
};

module.exports = {
  CoreCapabilities,
  AllCapabilities: Object.values(CoreCapabilities)
};
