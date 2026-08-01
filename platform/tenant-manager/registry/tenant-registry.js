const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const { TenantValidator } = require('./tenant-validator');
const { TenantLoader } = require('./tenant-loader');
const { TenantCache } = require('./tenant-cache');
const { TenantWatcher } = require('./tenant-watch');
const { TenantHistory } = require('./tenant-history');
const { TenantVersion } = require('./tenant-version');
const { TenantStatus } = require('./tenant-status');
const { TenantEvents } = require('./tenant-events');
const { ValidationError } = require('../../shared/errors');

class TenantRegistry {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../tenants');
    this.validator = new TenantValidator();
    this.loader = new TenantLoader(this.tenantsDir);
    this.cache = new TenantCache();
    this.history = new TenantHistory(this.tenantsDir);
    this.version = new TenantVersion(this.tenantsDir);
    this.status = new TenantStatus(this.tenantsDir);
    this.watcher = null;
  }

  initialize() {
    this.reload();
  }

  reload() {
    this.cache.clear();
    const configs = this.loader.loadAll();
    for (const config of configs) {
      try {
        this.validator.validate(config);
        this.cache.set(config);
      } catch (err) {
        console.error(`Invalid tenant configuration in registry for ${config.tenant_id}:`, err.message);
      }
    }
  }

  startWatcher() {
    if (!this.watcher) {
      this.watcher = new TenantWatcher(this.tenantsDir, () => {
        this.reload();
        TenantEvents.emit('TENANT_REGISTRY_RELOADED', 'system');
      });
      this.watcher.start();
    }
  }

  stopWatcher() {
    if (this.watcher) {
      this.watcher.stop();
      this.watcher = null;
    }
  }

  getTenant(id) {
    return this.cache.get(id);
  }

  getTenantBySlug(slug) {
    return this.cache.getBySlug(slug);
  }

  getTenantByDomain(domain) {
    return this.cache.getByDomain(domain);
  }

  getAllTenants() {
    return this.cache.getAll();
  }

  saveTenant(config, triggerEvent = true) {
    this.validator.validate(config);
    const tenantId = config.tenant_id;
    const tenantDir = path.join(this.tenantsDir, tenantId);
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }
    const tenantYamlPath = path.join(tenantDir, 'tenant.yaml');
    fs.writeFileSync(tenantYamlPath, yaml.dump(config), 'utf8');

    this.version.createVersionSnapshot(tenantId, config);
    this.cache.set(config);

    if (triggerEvent) {
      TenantEvents.emit('TENANT_UPDATED', tenantId, { config });
    }
    return config;
  }

  deleteTenant(id) {
    const tenant = this.cache.get(id);
    if (!tenant) return false;

    const tenantYamlPath = path.join(this.tenantsDir, id, 'tenant.yaml');
    if (fs.existsSync(tenantYamlPath)) {
      fs.unlinkSync(tenantYamlPath);
    }

    this.cache.delete(id);
    TenantEvents.emit('TENANT_DELETED', id);
    return true;
  }
}

const globalTenantRegistry = new TenantRegistry();
globalTenantRegistry.initialize();

module.exports = {
  TenantRegistry,
  globalTenantRegistry
};
