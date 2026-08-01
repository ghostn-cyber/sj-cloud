const { DependencyGraphError } = require('./compiler-errors');

class DependencyResolver {
  static resolve(services, context) {
    const serviceIds = new Set(Object.keys(services));
    const whitelisted = new Set([
      'postgres', 'redis', 'memcached', 'rabbitmq', 'mysql', 
      'minio', 'elasticsearch', 'kafka', 'cassandra', 'influxdb', 'storage'
    ]);

    for (const [id, service] of Object.entries(services)) {
      const dependencies = (service.identity && service.identity.metadata && service.identity.metadata.dependencies) || 
                           (service.spec && service.spec.service && service.spec.service.dependencies) || [];
      
      for (const dep of dependencies) {
        if (whitelisted.has(dep)) {
          if (!context.dependencyGraph.nodes.includes(dep)) {
            context.dependencyGraph.nodes.push(dep);
          }
          context.dependencyGraph.edges.push({ from: id, to: dep });
          continue;
        }

        if (!serviceIds.has(dep)) {
          throw new DependencyGraphError(`Service "${id}" specifies dependency "${dep}" which is not found in the service registry.`);
        }

        if (!context.dependencyGraph.nodes.includes(dep)) {
          context.dependencyGraph.nodes.push(dep);
        }
        context.dependencyGraph.edges.push({ from: id, to: dep });
      }
    }
  }
}

module.exports = DependencyResolver;
