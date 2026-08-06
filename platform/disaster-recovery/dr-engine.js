const fs = require('fs');
const path = require('path');

class DisasterRecoveryEngine {
  constructor(drDir) {
    this.drDir = drDir || path.resolve(__dirname, '../../../../dr-snapshots');
    if (!fs.existsSync(this.drDir)) {
      fs.mkdirSync(this.drDir, { recursive: true });
    }
  }

  async createPlatformSnapshot() {
    const snapshotId = `dr-${Date.now()}`;
    const snapshotPath = path.join(this.drDir, snapshotId);
    fs.mkdirSync(snapshotPath, { recursive: true });

    const configSource = path.resolve(__dirname, '../../../config');
    if (fs.existsSync(configSource)) {
      const dest = path.join(snapshotPath, 'config');
      this._copyDir(configSource, dest);
    }

    const manifest = {
      id: snapshotId,
      timestamp: new Date().toISOString(),
      services: ['postgres', 'redis', 'minio', 'registry-api', 'mesh-proxy']
    };
    fs.writeFileSync(path.join(snapshotPath, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

    return manifest;
  }

  _copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        this._copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

const globalDisasterRecoveryEngine = new DisasterRecoveryEngine();
module.exports = { DisasterRecoveryEngine, globalDisasterRecoveryEngine };
