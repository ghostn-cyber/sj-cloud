const RoutingStrategy = require('./strategy-interface');

class RoundRobinStrategy extends RoutingStrategy {
  constructor() {
    super('round_robin');
    this.rrIndices = {};
  }

  select(serviceId, pool, context = {}) {
    if (!pool || pool.length === 0) {
      throw new Error(`Round Robin Strategy: Empty pool for service ${serviceId}`);
    }

    if (this.rrIndices[serviceId] === undefined) {
      this.rrIndices[serviceId] = 0;
    }

    const index = this.rrIndices[serviceId] % pool.length;
    this.rrIndices[serviceId]++;
    return pool[index].url;
  }
}

module.exports = RoundRobinStrategy;
