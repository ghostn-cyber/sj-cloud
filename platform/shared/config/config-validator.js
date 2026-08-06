const schema = require('./config-schema');

function validate(config) {
  const errors = [];

  for (const key of Object.keys(schema)) {
    const spec = schema[key];
    const val = config[key];

    if (spec.required && (val === undefined || val === null || val === '')) {
      errors.push(`Missing required configuration variable: ${key}`);
      continue;
    }

    if (val !== undefined && val !== null) {
      if (spec.enum && !spec.enum.includes(val)) {
        errors.push(`Invalid value for ${key}: '${val}'. Allowed: ${spec.enum.join(', ')}`);
      }

      if (spec.type === 'url') {
        try {
          new URL(val);
        } catch (e) {
          errors.push(`Invalid URL for ${key}: '${val}'`);
        }
      } else if (spec.type === 'port') {
        const num = Number(val);
        if (!Number.isInteger(num) || num < 1 || num > 65535) {
          errors.push(`Invalid port for ${key}: '${val}'`);
        }
      } else if (spec.type === 'integer') {
        const num = Number(val);
        if (!Number.isInteger(num)) {
          errors.push(`Invalid integer for ${key}: '${val}'`);
        }
      } else if (spec.type === 'number') {
        const num = Number(val);
        if (isNaN(num) || num <= 0) {
          errors.push(`Invalid positive number for ${key}: '${val}'`);
        }
      } else if (spec.type === 'memory' || spec.type === 'storage') {
        if (!/^[0-9]+[kKmMgGtT]i?$/.test(val)) {
          errors.push(`Invalid format for ${key}: '${val}' (expected e.g. 128M, 5Gi)`);
        }
      }
    }
  }

  // Check duplicate ports
  const ports = {};
  const portKeys = ['HTTP_PORT', 'HTTPS_PORT', 'TRAEFIK_PORT', 'POSTGRES_PORT', 'REDIS_PORT'];
  for (const key of portKeys) {
    const port = config[key];
    if (port !== undefined) {
      if (ports[port]) {
        errors.push(`Duplicate port collision: ${key} and ${ports[port]} both use port ${port}`);
      } else {
        ports[port] = key;
      }
    }
  }

  // Check conflicting resource limits
  if (config.DEFAULT_MIN_REPLICAS !== undefined && config.DEFAULT_MAX_REPLICAS !== undefined) {
    if (config.DEFAULT_MIN_REPLICAS > config.DEFAULT_MAX_REPLICAS) {
      errors.push(`Resource conflict: DEFAULT_MIN_REPLICAS (${config.DEFAULT_MIN_REPLICAS}) is greater than DEFAULT_MAX_REPLICAS (${config.DEFAULT_MAX_REPLICAS})`);
    }
  }
  if (config.DEFAULT_REPLICAS !== undefined && config.MAX_REPLICAS !== undefined) {
    if (config.DEFAULT_REPLICAS > config.MAX_REPLICAS) {
      errors.push(`Resource conflict: DEFAULT_REPLICAS (${config.DEFAULT_REPLICAS}) is greater than MAX_REPLICAS (${config.MAX_REPLICAS})`);
    }
  }

  // Check domains validity
  if (config.PLATFORM_BASE_DOMAIN && !/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(config.PLATFORM_BASE_DOMAIN)) {
    errors.push(`Invalid base domain name: '${config.PLATFORM_BASE_DOMAIN}'`);
  }

  // If validation fails, compile errors and throw
  if (errors.length > 0) {
    throw new Error(`Configuration Validation Failed:\n- ${errors.join('\n- ')}`);
  }

  return true;
}

module.exports = {
  validate
};
