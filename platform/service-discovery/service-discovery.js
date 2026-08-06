const fs = require('fs');
const path = require('path');

class ServiceDiscovery {
  constructor() {
    this.snapshotPath = path.resolve(__dirname, '../../../config/services/snapshot.json');
  }

  resolve(serviceName) {
    if (!fs.existsSync(this.snapshotPath)) return null;
    try {
      const snap = JSON.parse(fs.readFileSync(this.snapshotPath, 'utf8'));
      return snap.services && snap.services[serviceName] ? snap.services[serviceName] : null;
    } catch {
      return null;
    }
  }
}

const globalServiceDiscovery = new ServiceDiscovery();
module.exports = { ServiceDiscovery, globalServiceDiscovery };
