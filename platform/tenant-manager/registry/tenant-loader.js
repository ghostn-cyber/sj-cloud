const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { ValidationError } = require('../../shared/errors');

class TenantLoader {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../tenants');
  }

  loadTenant(tenantId) {
    const tenantYamlPath = path.join(this.tenantsDir, tenantId, 'tenant.yaml');
    if (!fs.existsSync(tenantYamlPath)) {
      return null;
    }
    try {
      const content = fs.readFileSync(tenantYamlPath, 'utf8');
      return yaml.load(content);
    } catch (err) {
      throw new ValidationError(`Failed to parse tenant config for ${tenantId}: ${err.message}`, { rootCause: err });
    }
  }

  loadAll() {
    if (!fs.existsSync(this.tenantsDir)) {
      return [];
    }
    const entries = fs.readdirSync(this.tenantsDir, { withFileTypes: true });
    const tenants = [];
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name !== 'templates') {
        const config = this.loadTenant(entry.name);
        if (config) {
          tenants.push(config);
        }
      }
    }
    return tenants;
  }
}

module.exports = {
  TenantLoader
};
