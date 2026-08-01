class TenantIdentity {
  constructor(config) {
    this.tenantId = config.tenant_id;
    this.slug = config.slug;
    this.displayName = config.display_name;
    this.spiffeId = `spiffe://sj-cloud.local/ns/sj-tenants/sa/tenant-${config.tenant_id}`;
    Object.freeze(this);
  }
}

class TenantSecrets {
  constructor(secrets) {
    this.jwtSecret = secrets.jwt_secret || '';
    this.encryptionKey = secrets.encryption_key || '';
    this.apiSecret = secrets.api_secret || '';
    this.dbPassword = secrets.db_password || '';
    Object.freeze(this);
  }
}

class TenantRouting {
  constructor(config) {
    this.primaryDomain = config.primary_domain;
    this.customDomains = Object.freeze([...(config.custom_domains || [])]);
    this.gatewayPath = `/tenants/${config.tenant_id}`;
    Object.freeze(this);
  }
}

class TenantWorkspace {
  constructor(tenantId, basePath) {
    this.basePath = basePath;
    this.volumes = Object.freeze([
      { name: 'data', path: `${basePath}/data` },
      { name: 'logs', path: `${basePath}/logs` }
    ]);
    Object.freeze(this);
  }
}

class TenantStorage {
  constructor(config) {
    this.bucketName = config.storage_bucket || `sj-storage-${config.tenant_id}`;
    Object.freeze(this);
  }
}

class TenantMetrics {
  constructor(tenantId) {
    this.tenantId = tenantId;
    Object.freeze(this);
  }
}

class TenantEvents {
  constructor(tenantId) {
    this.tenantId = tenantId;
    Object.freeze(this);
  }
}

class TenantRuntime {
  constructor(config) {
    this.runtimeClass = (config.runtime && config.runtime.runtime_class) || 'nodejs';
    this.cpuLimit = (config.runtime && config.runtime.cpu) || '0.5';
    this.memoryLimit = (config.runtime && config.runtime.memory) || '512Mi';
    this.storageLimit = (config.runtime && config.runtime.storage) || '10Gi';
    Object.freeze(this);
  }
}

class TenantContext {
  constructor(config, secrets, workspacePath) {
    this.identity = new TenantIdentity(config);
    this.secrets = new TenantSecrets(secrets || {});
    this.routing = new TenantRouting(config);
    this.workspace = new TenantWorkspace(config.tenant_id, workspacePath);
    this.storage = new TenantStorage(config);
    this.runtime = new TenantRuntime(config);
    this.metrics = new TenantMetrics(config.tenant_id);
    this.events = new TenantEvents(config.tenant_id);
    this.status = config.status;
    this.plan = config.plan;
    Object.freeze(this);
  }
}

module.exports = {
  TenantContext,
  TenantRuntime,
  TenantWorkspace,
  TenantIdentity,
  TenantSecrets,
  TenantRouting,
  TenantStorage,
  TenantMetrics,
  TenantEvents
};
