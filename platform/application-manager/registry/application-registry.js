const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const { ApplicationValidator } = require('./application-validator');
const { ApplicationCache } = require('./application-cache');
const { ApplicationWatcher } = require('./application-watch');
const { ApplicationHistory } = require('./application-history');
const { ApplicationVersion } = require('./application-version');
const { ApplicationEvents } = require('./application-events');
const { ValidationError } = require('../../shared/errors');

class ApplicationRegistry {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.validator = new ApplicationValidator();
    this.cache = new ApplicationCache();
    this.history = new ApplicationHistory(this.tenantsDir);
    this.version = new ApplicationVersion(this.tenantsDir);
    this.watcher = null;
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
        this.cache.set(config.application_id, config);
      } catch (err) {
        console.error(`Invalid application configuration in registry for ${config.application_id}:`, err.message);
      }
    }
  }

  loadAll() {
    const apps = [];
    if (!fs.existsSync(this.tenantsDir)) return apps;
    const tenants = fs.readdirSync(this.tenantsDir);
    for (const tenantId of tenants) {
      const appsDir = path.join(this.tenantsDir, tenantId, 'apps');
      if (fs.existsSync(appsDir) && fs.statSync(appsDir).isDirectory()) {
        const appDirs = fs.readdirSync(appsDir);
        for (const appId of appDirs) {
          const appYaml = path.join(appsDir, appId, 'application.yaml');
          if (fs.existsSync(appYaml)) {
            try {
              const content = fs.readFileSync(appYaml, 'utf8');
              const parsed = yaml.load(content);
              apps.push(parsed);
            } catch (err) {
              console.error(`Error loading app from ${appYaml}:`, err.message);
            }
          }
        }
      }
    }
    return apps;
  }

  startWatcher() {
    if (!this.watcher) {
      this.watcher = new ApplicationWatcher(this.tenantsDir, () => {
        this.reload();
        ApplicationEvents.emit('APPLICATION_REGISTRY_RELOADED', 'system');
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

  getApplication(id) {
    return this.cache.get(id);
  }

  getAllApplications() {
    return this.cache.getAll();
  }

  saveApplication(config, triggerEvent = true) {
    this.validator.validate(config);
    const tenantId = config.tenant_id;
    const appId = config.application_id;
    const appDir = path.join(this.tenantsDir, tenantId, 'apps', appId);
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }
    const appYamlPath = path.join(appDir, 'application.yaml');
    fs.writeFileSync(appYamlPath, yaml.dump(config), 'utf8');

    this.version.createVersionSnapshot(tenantId, appId, config);
    this.cache.set(appId, config);

    if (triggerEvent) {
      ApplicationEvents.emit('APPLICATION_CREATED', appId, { tenantId, config });
    }
    return config;
  }

  deleteApplication(id) {
    const app = this.cache.get(id);
    if (!app) return false;

    const tenantId = app.tenant_id;
    const appYamlPath = path.join(this.tenantsDir, tenantId, 'apps', id, 'application.yaml');
    if (fs.existsSync(appYamlPath)) {
      fs.unlinkSync(appYamlPath);
    }

    this.cache.delete(id);
    ApplicationEvents.emit('APPLICATION_DELETED', id, { tenantId });
    return true;
  }
}

const globalApplicationRegistry = new ApplicationRegistry();
globalApplicationRegistry.initialize();

module.exports = {
  ApplicationRegistry,
  globalApplicationRegistry
};
