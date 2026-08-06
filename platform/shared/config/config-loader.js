const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../../');

function parseEnvFile(content) {
  const env = {};
  if (!content) return env;
  const lines = content.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.substring(0, idx).trim();
    let value = line.substring(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
  return env;
}

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      return parseEnvFile(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.warn(`[ConfigLoader] Failed to read env file: ${filePath}`, e);
    }
  }
  return {};
}

function loadSecret(name) {
  // 1. Try Docker secrets path first (/run/secrets/)
  const dockerSecretPath = path.join('/run/secrets', name);
  if (fs.existsSync(dockerSecretPath)) {
    try {
      return fs.readFileSync(dockerSecretPath, 'utf8').trim();
    } catch (e) {}
  }

  // 2. Fallback to local development secrets directory
  const localSecretPath = path.join(repoRoot, 'infrastructure/secrets', name);
  if (fs.existsSync(localSecretPath)) {
    try {
      return fs.readFileSync(localSecretPath, 'utf8').trim();
    } catch (e) {}
  }

  // 3. Fallback to process.env if available
  const envName = name.toUpperCase();
  if (process.env[envName]) {
    return process.env[envName];
  }

  return null;
}

function load(runtimeOverrides = {}) {
  // 1. Load default.env
  const defaultPath = path.join(repoRoot, 'config/default.env');
  const defaults = loadEnvFile(defaultPath);

  // 2. Determine target environment (default to PLATFORM_ENV or process.env.PLATFORM_ENV or process.env.NODE_ENV)
  const envName = runtimeOverrides.PLATFORM_ENV ||
                  process.env.PLATFORM_ENV ||
                  process.env.NODE_ENV ||
                  defaults.PLATFORM_ENV ||
                  'development';

  // 3. Load environment-specific overrides
  const envPath = path.join(repoRoot, `config/${envName}.env`);
  const envOverrides = loadEnvFile(envPath);

  // 4. Merge defaults + environment overrides
  const config = Object.assign({}, defaults, envOverrides);

  // Force environment key
  config.PLATFORM_ENV = envName;

  // 5. Load secrets dynamically
  const secrets = {
    POSTGRES_PASSWORD: loadSecret('postgres_password') || 'sjcloudpassword',
    REDIS_PASSWORD: loadSecret('redis_password') || 'sjredispassword',
    MINIO_ROOT_USER: loadSecret('minio_root_user') || 'sjminio',
    MINIO_ROOT_PASSWORD: loadSecret('minio_root_password') || 'sjminiopassword',
    GRAFANA_ADMIN_PASSWORD: loadSecret('grafana_admin_password') || 'sjadminpassword',
    JWT_SECRET: loadSecret('jwt_secret') || 'default-jwt-secret-key-change-me',
    PLATFORM_SECRET_KEY: loadSecret('encryption_key') || 'default-secret-key-32-chars-long!'
  };

  // Merge secrets
  Object.assign(config, secrets);

  // 6. Merge process.env variables matching schema keys (highest priority before manual runtime overrides)
  const schemaKeys = Object.keys(require('./config-schema'));
  for (const key of schemaKeys) {
    if (process.env[key] !== undefined) {
      config[key] = process.env[key];
    }
  }

  // 7. Merge explicit runtime overrides
  Object.assign(config, runtimeOverrides);

  // 8. Normalize types based on schema types
  const schema = require('./config-schema');
  for (const key of Object.keys(schema)) {
    if (config[key] !== undefined && config[key] !== null) {
      const val = config[key];
      const type = schema[key].type;
      if (type === 'boolean') {
        config[key] = (val === true || val === 'true');
      } else if (type === 'port' || type === 'integer') {
        config[key] = parseInt(val, 10);
      } else if (type === 'number') {
        config[key] = parseFloat(val);
      }
    } else if (schema[key].default !== undefined) {
      config[key] = schema[key].default;
    }
  }

  return config;
}

module.exports = {
  load
};
