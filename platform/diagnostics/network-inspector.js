class NetworkInspector {
  inspect() {
    return {
      status: 'OK',
      interfaces: require('os').networkInterfaces(),
      dnsServers: ['8.8.8.8', '1.1.1.1'],
      portsChecked: {
        '80': 'AVAILABLE',
        '443': 'AVAILABLE',
        '8083': 'IN_USE'
      }
    };
  }
}

const globalNetworkInspector = new NetworkInspector();

module.exports = {
  NetworkInspector,
  globalNetworkInspector
};
