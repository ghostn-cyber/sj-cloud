/**
 * SJ Cloud Configuration Schema
 */
const schema = {
  // Platform settings
  PLATFORM_NAME: { type: 'string', required: true, default: 'SJ Cloud' },
  PLATFORM_VERSION: { type: 'string', required: true, default: '1.0.0' },
  PLATFORM_ENV: { type: 'string', required: true, default: 'development', enum: ['development', 'testing', 'staging', 'production'] },
  PLATFORM_REGION: { type: 'string', required: true, default: 'us-east-1' },
  PLATFORM_TIMEZONE: { type: 'string', required: true, default: 'UTC' },
  PLATFORM_BASE_DOMAIN: { type: 'string', required: true, default: 'sj-cloud.test' },
  PLATFORM_PUBLIC_URL: { type: 'url', required: true },
  PLATFORM_ADMIN_URL: { type: 'url', required: true },
  PLATFORM_API_URL: { type: 'url', required: true },
  PLATFORM_METRICS_URL: { type: 'url', required: true },
  PLATFORM_REGISTRY_URL: { type: 'url', required: true },
  PLATFORM_MESH_URL: { type: 'url', required: true },

  // Networking settings
  HTTP_PORT: { type: 'port', required: true, default: 80 },
  HTTPS_PORT: { type: 'port', required: true, default: 443 },
  TRAEFIK_PORT: { type: 'port', required: true, default: 8080 },
  PROXY_NETWORK: { type: 'string', required: true, default: 'sj-proxy' },
  SERVICE_NETWORK: { type: 'string', required: true, default: 'sj-services' },
  DATA_NETWORK: { type: 'string', required: true, default: 'sj-data' },
  MONITORING_NETWORK: { type: 'string', required: true, default: 'sj-monitoring' },
  BACKUP_NETWORK: { type: 'string', required: true, default: 'sj-backup' },

  // Routing configurations
  DEFAULT_TENANT_DOMAIN: { type: 'string', required: true },
  DEFAULT_APPLICATION_DOMAIN: { type: 'string', required: true },
  ENABLE_LEGACY_DOMAINS: { type: 'boolean', required: true, default: false },
  FORCE_HTTPS: { type: 'boolean', required: true, default: true },
  TLS_ENABLED: { type: 'boolean', required: true, default: true },
  TLS_MIN_VERSION: { type: 'string', required: true, default: 'VersionTLS12' },
  CERTIFICATE_DIRECTORY: { type: 'string', required: true },

  // Resource limits
  DEFAULT_CPU_LIMIT: { type: 'number', required: true, default: 0.2 },
  DEFAULT_MEMORY_LIMIT: { type: 'memory', required: true, default: '128M' },
  DEFAULT_STORAGE_LIMIT: { type: 'storage', required: true, default: '5Gi' },
  DEFAULT_REPLICAS: { type: 'integer', required: true, default: 1 },
  MAX_REPLICAS: { type: 'integer', required: true, default: 5 },
  DEFAULT_TIMEOUT: { type: 'integer', required: true, default: 5000 },
  REQUEST_TIMEOUT: { type: 'integer', required: true, default: 10000 },
  BUILD_TIMEOUT: { type: 'integer', required: true, default: 300000 },
  DEPLOYMENT_TIMEOUT: { type: 'integer', required: true, default: 60000 },
  PIPELINE_TIMEOUT: { type: 'integer', required: true, default: 600000 },

  // Database settings
  POSTGRES_HOST: { type: 'string', required: true },
  POSTGRES_PORT: { type: 'port', required: true, default: 5432 },
  POSTGRES_DATABASE: { type: 'string', required: true },
  POSTGRES_POOL_SIZE: { type: 'integer', required: true, default: 10 },
  REDIS_HOST: { type: 'string', required: true },
  REDIS_PORT: { type: 'port', required: true, default: 6379 },
  MINIO_ENDPOINT: { type: 'url', required: true },
  MINIO_BUCKET_BACKUPS: { type: 'string', required: true },
  MINIO_BUCKET_RELEASES: { type: 'string', required: true },
  MINIO_BUCKET_ARTIFACTS: { type: 'string', required: true },
  MINIO_BUCKET_LOGS: { type: 'string', required: true },

  // Monitoring endpoints
  PROMETHEUS_ENDPOINT: { type: 'url', required: true },
  GRAFANA_ENDPOINT: { type: 'url', required: true },
  LOKI_ENDPOINT: { type: 'url', required: true },
  OTEL_ENDPOINT: { type: 'string', required: true },
  JAEGER_ENDPOINT: { type: 'url', required: true },
  ALERTMANAGER_ENDPOINT: { type: 'url', required: true },
  METRIC_RETENTION_DAYS: { type: 'integer', required: true, default: 15 },
  LOG_RETENTION_DAYS: { type: 'integer', required: true, default: 30 },
  TRACE_RETENTION_DAYS: { type: 'integer', required: true, default: 7 },

  // Security policies
  JWT_EXPIRATION: { type: 'integer', required: true, default: 3600 },
  SESSION_TIMEOUT: { type: 'integer', required: true, default: 1800 },
  PASSWORD_POLICY: { type: 'string', required: true, default: 'strong' },
  ENABLE_AUDIT_LOGGING: { type: 'boolean', required: true, default: true },
  ENABLE_TRACING: { type: 'boolean', required: true, default: true },
  ENABLE_METRICS: { type: 'boolean', required: true, default: true },
  ENABLE_RATE_LIMITING: { type: 'boolean', required: true, default: true },
  ENABLE_TLS: { type: 'boolean', required: true, default: true },
  ENABLE_SECURITY_HEADERS: { type: 'boolean', required: true, default: true },

  // Scaling configurations
  AUTOSCALING_ENABLED: { type: 'boolean', required: true, default: false },
  DEFAULT_MIN_REPLICAS: { type: 'integer', required: true, default: 1 },
  DEFAULT_MAX_REPLICAS: { type: 'integer', required: true, default: 5 },
  CPU_SCALE_THRESHOLD: { type: 'number', required: true, default: 80 },
  MEMORY_SCALE_THRESHOLD: { type: 'number', required: true, default: 85 },

  // Backup system parameters
  BACKUP_RETENTION_DAYS: { type: 'integer', required: true, default: 7 },
  BACKUP_INTERVAL: { type: 'integer', required: true, default: 86400 },
  BACKUP_COMPRESSION: { type: 'string', required: true, default: 'gzip' },
  VERIFY_BACKUPS: { type: 'boolean', required: true, default: true },

  // Build Engine options
  DEFAULT_BUILDER: { type: 'string', required: true, default: 'docker' },
  BUILD_CACHE: { type: 'boolean', required: true, default: true },
  IMAGE_REGISTRY: { type: 'string', required: true },
  IMAGE_NAMESPACE: { type: 'string', required: true },
  IMAGE_RETENTION: { type: 'integer', required: true, default: 5 },

  // Pipeline Engine properties
  PIPELINE_CONCURRENCY: { type: 'integer', required: true, default: 2 },
  PIPELINE_PARALLELISM: { type: 'integer', required: true, default: 4 },
  MANUAL_APPROVAL_TIMEOUT: { type: 'integer', required: true, default: 3600 },
  ENABLE_SECURITY_SCAN: { type: 'boolean', required: true, default: true },
  ENABLE_SBOM: { type: 'boolean', required: true, default: true },

  // Feature Flags
  ENABLE_PIPELINES: { type: 'boolean', required: true, default: true },
  ENABLE_APPLICATIONS: { type: 'boolean', required: true, default: true },
  ENABLE_AUTOSCALING: { type: 'boolean', required: true, default: false },
  ENABLE_MULTI_REGION: { type: 'boolean', required: true, default: false },
  ENABLE_MESH: { type: 'boolean', required: true, default: true },
  ENABLE_MONITORING: { type: 'boolean', required: true, default: true },
  ENABLE_BACKUPS: { type: 'boolean', required: true, default: true },

  // Secrets (automatically redacted on APIs)
  POSTGRES_PASSWORD: { type: 'string', required: true, secret: true },
  REDIS_PASSWORD: { type: 'string', required: true, secret: true },
  MINIO_ROOT_USER: { type: 'string', required: true, secret: true },
  MINIO_ROOT_PASSWORD: { type: 'string', required: true, secret: true },
  GRAFANA_ADMIN_PASSWORD: { type: 'string', required: true, secret: true },
  JWT_SECRET: { type: 'string', required: true, secret: true },
  PLATFORM_SECRET_KEY: { type: 'string', required: true, secret: true }
};

module.exports = schema;
