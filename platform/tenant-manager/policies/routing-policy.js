const { globalTenantRegistry } = require('../registry/tenant-registry');

class RoutingPolicy {
  evaluate(action, tenantId, params = {}) {
    if (action === 'provision' || action === 'update-domains') {
      const primaryDomain = params.primary_domain || `${tenantId}.sj-cloud.test`;
      const customDomains = params.custom_domains || [];

      const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,6}$/;
      if (!domainRegex.test(primaryDomain)) {
        return { allowed: false, reason: `Primary domain format is invalid: ${primaryDomain}` };
      }

      for (const domain of customDomains) {
        if (!domainRegex.test(domain)) {
          return { allowed: false, reason: `Custom domain format is invalid: ${domain}` };
        }
      }

      // Check domain conflicts in registry
      const allTenants = globalTenantRegistry.getAllTenants();
      for (const tenant of allTenants) {
        if (tenant.tenant_id === tenantId) continue;
        
        if (tenant.primary_domain === primaryDomain) {
          return { allowed: false, reason: `Primary domain ${primaryDomain} conflicts with tenant ${tenant.tenant_id}` };
        }

        const existingCustoms = tenant.custom_domains || [];
        for (const domain of customDomains) {
          if (tenant.primary_domain === domain || existingCustoms.includes(domain)) {
            return { allowed: false, reason: `Domain ${domain} is already in use by tenant ${tenant.tenant_id}` };
          }
        }
      }
    }
    return { allowed: true };
  }
}

module.exports = { RoutingPolicy };
