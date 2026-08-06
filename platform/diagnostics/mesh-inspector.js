class MeshInspector {
  inspect() {
    return {
      status: 'OK',
      meshType: 'Traefik',
      circuitBreakerStatus: 'NORMAL',
      activeConnections: 12,
      routesConfigured: 5
    };
  }
}

const globalMeshInspector = new MeshInspector();

module.exports = {
  MeshInspector,
  globalMeshInspector
};
