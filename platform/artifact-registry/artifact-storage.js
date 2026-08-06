const fs = require('fs');
const path = require('path');

class ArtifactStorage {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  getArtifactPath(tenantId, filename) {
    return path.join(this.tenantsDir, tenantId, 'artifacts', filename);
  }

  saveArtifact(tenantId, filename, content) {
    const filePath = this.getArtifactPath(tenantId, filename);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
  }

  deleteArtifact(tenantId, filename) {
    const filePath = this.getArtifactPath(tenantId, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }
}

module.exports = {
  ArtifactStorage
};
