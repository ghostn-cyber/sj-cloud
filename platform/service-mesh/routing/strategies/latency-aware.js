const RoutingStrategy = require('./strategy-interface');

class LatencyAwareStrategy extends RoutingStrategy {
  constructor() {
    super('latency_aware');
  }

  select(serviceId, pool, context = {}) {
    throw new Error('LatencyAwareStrategy: Method not implemented');
  }
}

module.exports = LatencyAwareStrategy;
