class TenantCache {
  constructor() {
    this.tenantsById = new Map();
    this.tenantsBySlug = new Map();
    this.tenantsByDomain = new Map();
  }

  set(tenant) {
    const id = tenant.tenant_id;
    this.tenantsById.set(id, tenant);
    if (tenant.slug) {
      this.tenantsBySlug.set(tenant.slug, tenant);
    }
    
    // Index by primary domain
    if (tenant.primary_domain) {
      this.tenantsByDomain.set(tenant.primary_domain.toLowerCase(), tenant);
    }
    
    // Index by custom domains
    if (Array.isArray(tenant.custom_domains)) {
      for (const domain of tenant.custom_domains) {
        this.tenantsByDomain.set(domain.toLowerCase(), tenant);
      }
    }
  }

  get(id) {
    return this.tenantsById.get(id) || null;
  }

  getBySlug(slug) {
    return this.tenantsBySlug.get(slug) || null;
  }

  getByDomain(domain) {
    if (!domain) return null;
    return this.tenantsByDomain.get(domain.toLowerCase()) || null;
  }

  delete(id) {
    const tenant = this.tenantsById.get(id);
    if (!tenant) return;
    this.tenantsById.delete(id);
    if (tenant.slug) {
      this.tenantsBySlug.delete(tenant.slug);
    }
    if (tenant.primary_domain) {
      this.tenantsByDomain.delete(tenant.primary_domain.toLowerCase());
    }
    if (Array.isArray(tenant.custom_domains)) {
      for (const domain of tenant.custom_domains) {
        this.tenantsByDomain.delete(domain.toLowerCase());
      }
    }
  }

  clear() {
    this.tenantsById.clear();
    this.tenantsBySlug.clear();
    this.tenantsByDomain.clear();
  }

  getAll() {
    return Array.from(this.tenantsById.values());
  }
}

module.exports = {
  TenantCache
};
