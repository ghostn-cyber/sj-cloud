const { TenantValidator } = require('../registry/tenant-validator');

class TenantSpec {
  constructor(config) {
    this.config = config;
  }

  validate() {
    const validator = new TenantValidator();
    return validator.validate(this.config);
  }

  getTenantId() {
    return this.config.tenant_id;
  }

  getPrimaryDomain() {
    return this.config.primary_domain;
  }

  getCustomDomains() {
    return this.config.custom_domains || [];
  }

  getPlan() {
    return this.config.plan;
  }

  getStatus() {
    return this.config.status;
  }
}

module.exports = { TenantSpec };
