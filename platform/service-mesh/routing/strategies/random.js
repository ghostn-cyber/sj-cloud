const RoutingStrategy = require('./strategy-interface');

class RandomStrategy extends RoutingStrategy {
  constructor() {
    super('random');
  }

  select(serviceId, pool, context = {}) {
    throw new Error('RandomStrategy: Method not implemented');
  }
}

module.exports = RandomStrategy;
