const { globalConfigCache } = require('./config-cache');
require('./config-manager');

const configKeys = {
  PlatformConfig: [
    'PLATFORM_NAME', 'PLATFORM_VERSION', 'PLATFORM_ENV', 'PLATFORM_REGION', 'PLATFORM_TIMEZONE',
    'PLATFORM_BASE_DOMAIN', 'PLATFORM_PUBLIC_URL', 'PLATFORM_ADMIN_URL', 'PLATFORM_API_URL',
    'PLATFORM_METRICS_URL', 'PLATFORM_REGISTRY_URL', 'PLATFORM_MESH_URL'
  ],
  NetworkConfig: [
    'HTTP_PORT', 'HTTPS_PORT', 'TRAEFIK_PORT', 'PROXY_NETWORK', 'SERVICE_NETWORK',
    'DATA_NETWORK', 'MONITORING_NETWORK', 'BACKUP_NETWORK'
  ],
  DatabaseConfig: [
    'POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_DATABASE', 'POSTGRES_POOL_SIZE',
    'REDIS_HOST', 'REDIS_PORT'
  ],
  StorageConfig: [
    'MINIO_ENDPOINT', 'MINIO_BUCKET_BACKUPS', 'MINIO_BUCKET_RELEASES',
    'MINIO_BUCKET_ARTIFACTS', 'MINIO_BUCKET_LOGS'
  ],
  ResourceConfig: [
    'DEFAULT_CPU_LIMIT', 'DEFAULT_MEMORY_LIMIT', 'DEFAULT_STORAGE_LIMIT',
    'DEFAULT_REPLICAS', 'MAX_REPLICAS', 'DEFAULT_TIMEOUT', 'REQUEST_TIMEOUT',
    'BUILD_TIMEOUT', 'DEPLOYMENT_TIMEOUT', 'PIPELINE_TIMEOUT'
  ],
  SecurityConfig: [
    'JWT_EXPIRATION', 'SESSION_TIMEOUT', 'PASSWORD_POLICY', 'ENABLE_AUDIT_LOGGING',
    'ENABLE_TRACING', 'ENABLE_METRICS', 'ENABLE_RATE_LIMITING', 'ENABLE_TLS',
    'ENABLE_SECURITY_HEADERS', 'JWT_SECRET', 'PLATFORM_SECRET_KEY', 'POSTGRES_PASSWORD',
    'REDIS_PASSWORD', 'MINIO_ROOT_USER', 'MINIO_ROOT_PASSWORD', 'GRAFANA_ADMIN_PASSWORD'
  ],
  MonitoringConfig: [
    'PROMETHEUS_ENDPOINT', 'GRAFANA_ENDPOINT', 'LOKI_ENDPOINT', 'OTEL_ENDPOINT',
    'JAEGER_ENDPOINT', 'ALERTMANAGER_ENDPOINT', 'METRIC_RETENTION_DAYS',
    'LOG_RETENTION_DAYS', 'TRACE_RETENTION_DAYS'
  ],
  PipelineConfig: [
    'PIPELINE_CONCURRENCY', 'PIPELINE_PARALLELISM', 'MANUAL_APPROVAL_TIMEOUT',
    'ENABLE_SECURITY_SCAN', 'ENABLE_SBOM', 'ENABLE_PIPELINES'
  ],
  BuildConfig: [
    'DEFAULT_BUILDER', 'BUILD_CACHE', 'IMAGE_REGISTRY', 'IMAGE_NAMESPACE', 'IMAGE_RETENTION'
  ],
  TenantConfig: [
    'DEFAULT_TENANT_DOMAIN', 'ENABLE_LEGACY_DOMAINS'
  ],
  ApplicationConfig: [
    'DEFAULT_APPLICATION_DOMAIN', 'ENABLE_APPLICATIONS'
  ]
};

const contexts = {};

for (const [contextName, keys] of Object.entries(configKeys)) {
  contexts[contextName] = {};
  for (const key of keys) {
    Object.defineProperty(contexts[contextName], key, {
      get() {
        const fullConfig = globalConfigCache.get();
        if (!fullConfig) {
          throw new Error('Platform configuration has not been loaded. Call ConfigManager.load() first.');
        }
        return fullConfig[key];
      },
      set() {
        throw new TypeError(`Property "${key}" of configuration context is read-only`);
      },
      enumerable: true
    });
  }
  Object.freeze(contexts[contextName]);
}

module.exports = contexts;
