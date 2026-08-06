const fs = require('fs');
const path = require('path');
const { ArtifactValidator } = require('./artifact-validator');
const { ArtifactStorage } = require('./artifact-storage');
const { ArtifactCache } = require('./artifact-cache');
const { ArtifactHistory } = require('./artifact-history');
const { ArtifactEvents } = require('./artifact-events');

class ArtifactManager {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.validator = new ArtifactValidator();
    this.storage = new ArtifactStorage(this.tenantsDir);
    this.cache = new ArtifactCache();
    this.history = new ArtifactHistory(this.tenantsDir);
    this.initialize();
  }

  initialize() {
    this.reload();
  }

  reload() {
    this.cache.clear();
    if (!fs.existsSync(this.tenantsDir)) return;
    const tenants = fs.readdirSync(this.tenantsDir);
    for (const tenantId of tenants) {
      const artDir = path.join(this.tenantsDir, tenantId, 'artifacts');
      if (fs.existsSync(artDir) && fs.statSync(artDir).isDirectory()) {
        const files = fs.readdirSync(artDir);
        for (const file of files) {
          if (file.endsWith('.meta.json')) {
            try {
              const meta = JSON.parse(fs.readFileSync(path.join(artDir, file), 'utf8'));
              this.cache.set(meta.artifact_id, meta);
            } catch (err) {
              console.error(`Failed to load artifact metadata ${file}:`, err.message);
            }
          }
        }
      }
    }
  }

  saveArtifact(artifact, content = '') {
    this.validator.validate(artifact);
    const tenantId = artifact.tenant_id;
    const artId = artifact.artifact_id;
    
    // Save physical file
    const filename = `${artId}.${artifact.type}`;
    const filePath = this.storage.saveArtifact(tenantId, filename, content);
    artifact.path = filePath;

    // Save metadata
    const metaFilename = `${artId}.meta.json`;
    const metaPath = this.storage.saveArtifact(tenantId, metaFilename, JSON.stringify(artifact, null, 2));

    this.cache.set(artId, artifact);
    this.history.log(tenantId, artId, 'ARTIFACT_CREATED', { artifact });
    ArtifactEvents.emit('ArtifactPublished', artId, tenantId, { artifact });
    return artifact;
  }

  getArtifact(id) {
    return this.cache.get(id);
  }

  getAllArtifacts() {
    return this.cache.getAll();
  }

  deleteArtifact(id) {
    const artifact = this.cache.get(id);
    if (!artifact) return false;

    const tenantId = artifact.tenant_id;
    const filename = `${id}.${artifact.type}`;
    const metaFilename = `${id}.meta.json`;

    this.storage.deleteArtifact(tenantId, filename);
    this.storage.deleteArtifact(tenantId, metaFilename);

    this.cache.delete(id);
    this.history.log(tenantId, id, 'ARTIFACT_DELETED', { artifact });
    ArtifactEvents.emit('ArtifactDeleted', id, tenantId, { artifact });
    return true;
  }
}

const globalArtifactManager = new ArtifactManager();

module.exports = {
  ArtifactManager,
  globalArtifactManager
};
