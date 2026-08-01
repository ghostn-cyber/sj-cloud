const { RoundRobinStrategy } = require('../routing/strategies');

class LoadBalancer {
  constructor() {
    this.rrStrategy = new RoundRobinStrategy();
    this.activeConnections = {}; // endpointURL -> number
  }

  incrementConnections(endpoint) {
    this.activeConnections[endpoint] = (this.activeConnections[endpoint] || 0) + 1;
  }

  decrementConnections(endpoint) {
    if (this.activeConnections[endpoint]) {
      this.activeConnections[endpoint]--;
    }
  }

  /**
   * Select a target endpoint from the available list using the configured strategy
   * @param {string} serviceId
   * @param {Object} policy Load balancer policy (contains strategy)
   * @param {Array<string|{url: string, weight: number}>} endpoints List of target endpoints
   * @param {Object} statuses Map of active endpoint health states (optional)
   * @returns {string} The selected endpoint URL
   */
  selectEndpoint(serviceId, policy = {}, endpoints = [], statuses = {}) {
    const strategy = policy.strategy || 'round_robin';

    if (!endpoints || endpoints.length === 0) {
      throw new Error(`Load Balancer: No endpoints available for service ${serviceId}`);
    }

    // 1. Filter out unhealthy endpoints if any statuses are provided
    let healthyEndpoints = endpoints.filter(ep => {
      const urlStr = typeof ep === 'string' ? ep : ep.url;
      return statuses[urlStr] !== 'Unhealthy';
    });

    if (healthyEndpoints.length === 0) {
      healthyEndpoints = endpoints;
    }

    const pool = healthyEndpoints.map(ep => {
      if (typeof ep === 'string') {
        return { url: ep, weight: 1 };
      }
      return { url: ep.url, weight: ep.weight || 1 };
    });

    if (pool.length === 1) {
      return pool[0].url;
    }

    switch (strategy) {
      case 'least_connections':
        return this.selectLeastConnections(pool);
      case 'weighted':
        return this.selectWeighted(pool);
      case 'round_robin':
      default:
        return this.rrStrategy.select(serviceId, pool);
    }
  }

  selectLeastConnections(pool) {
    let minConns = Infinity;
    let selected = pool[0].url;

    for (const ep of pool) {
      const conns = this.activeConnections[ep.url] || 0;
      if (conns < minConns) {
        minConns = conns;
        selected = ep.url;
      }
    }
    return selected;
  }

  selectWeighted(pool) {
    const totalWeight = pool.reduce((acc, ep) => acc + ep.weight, 0);
    let r = Math.random() * totalWeight;
    for (const ep of pool) {
      r -= ep.weight;
      if (r <= 0) {
        return ep.url;
      }
    }
    return pool[pool.length - 1].url;
  }
}

const globalLoadBalancer = new LoadBalancer();

module.exports = {
  LoadBalancer,
  globalLoadBalancer
};
