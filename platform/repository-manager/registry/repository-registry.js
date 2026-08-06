const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const { RepositoryValidator } = require('./repository-validator');
const { RepositoryCache } = require('./repository-cache');
const { RepositoryHistory } = require('./repository-history');
const { RepositoryEvents } = require('./repository-events');
const { ValidationError } = require('../../shared/errors');

class RepositoryRegistry {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.validator = new RepositoryValidator();
    this.cache = new RepositoryCache();
    this.history = new RepositoryHistory(this.tenantsDir);
  }

  initialize() {
    this.reload();
  }

  reload() {
    this.cache.clear();
    const configs = this.loadAll();
    for (const config of configs) {
      try {
        this.validator.validate(config);
        this.cache.set(config.repository_id, config);
      } catch (err) {
        console.error(`Invalid repository configuration in registry for ${config.repository_id}:`, err.message);
      }
    }
  }

  loadAll() {
    const repos = [];
    if (!fs.existsSync(this.tenantsDir)) return repos;
    const tenants = fs.readdirSync(this.tenantsDir);
    for (const tenantId of tenants) {
      const reposDir = path.join(this.tenantsDir, tenantId, 'repositories');
      if (fs.existsSync(reposDir) && fs.statSync(reposDir).isDirectory()) {
        const repoFiles = fs.readdirSync(reposDir);
        for (const file of repoFiles) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const filepath = path.join(reposDir, file);
            try {
              const content = fs.readFileSync(filepath, 'utf8');
              const parsed = yaml.load(content);
              repos.push(parsed);
            } catch (err) {
              console.error(`Error loading repo from ${filepath}:`, err.message);
            }
          }
        }
      }
    }
    return repos;
  }

  getRepository(id) {
    return this.cache.get(id);
  }

  getAllRepositories() {
    return this.cache.getAll();
  }

  saveRepository(config, triggerEvent = true) {
    this.validator.validate(config);
    const tenantId = config.tenant_id;
    const repoId = config.repository_id;
    const repoDir = path.join(this.tenantsDir, tenantId, 'repositories');
    if (!fs.existsSync(repoDir)) {
      fs.mkdirSync(repoDir, { recursive: true });
    }
    const repoYamlPath = path.join(repoDir, `${repoId}.yaml`);
    fs.writeFileSync(repoYamlPath, yaml.dump(config), 'utf8');

    this.history.logHistory(tenantId, repoId, 'REPOSITORY_SAVED', { config });
    this.cache.set(repoId, config);

    if (triggerEvent) {
      RepositoryEvents.emit('REPOSITORY_REGISTERED', repoId, tenantId, { config });
    }
    return config;
  }

  deleteRepository(id) {
    const repo = this.cache.get(id);
    if (!repo) return false;

    const tenantId = repo.tenant_id;
    const repoYamlPath = path.join(this.tenantsDir, tenantId, 'repositories', `${id}.yaml`);
    if (fs.existsSync(repoYamlPath)) {
      fs.unlinkSync(repoYamlPath);
    }

    this.history.logHistory(tenantId, id, 'REPOSITORY_DELETED', { repo });
    this.cache.delete(id);
    RepositoryEvents.emit('REPOSITORY_DELETED', id, tenantId, { repo });
    return true;
  }
}

const globalRepositoryRegistry = new RepositoryRegistry();
globalRepositoryRegistry.initialize();

module.exports = {
  RepositoryRegistry,
  globalRepositoryRegistry
};
