const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { LifecycleError } = require('../../shared/errors');

class DnsGenerator {
  constructor(traefikDynamicDir) {
    this.traefikDynamicDir = traefikDynamicDir || path.resolve(__dirname, '../../../infrastructure/traefik/dynamic');
  }

  generate(tenantId, primaryDomain, customDomains = []) {
    const domains = [primaryDomain, ...customDomains];
    const hostRule = domains.map(d => `Host(\`${d}\`)`).join(' || ');

    const traefikConfig = {
      http: {
        routers: {
          [`tenant-${tenantId}`]: {
            entryPoints: ['web'],
            rule: hostRule,
            service: `tenant-${tenantId}-service`
          },
          [`tenant-${tenantId}-secure`]: {
            entryPoints: ['websecure'],
            rule: hostRule,
            service: `tenant-${tenantId}-service`,
            tls: {
              domains: [
                {
                  main: primaryDomain,
                  sans: [`*.${primaryDomain}`]
                }
              ]
            }
          }
        },
        services: {
          [`tenant-${tenantId}-service`]: {
            loadBalancer: {
              servers: [
                {
                  url: `http://sj-tenant-${tenantId}:80`
                }
              ]
            }
          }
        }
      }
    };

    const destPath = path.join(this.traefikDynamicDir, `tenant-${tenantId}.yml`);
    try {
      if (!fs.existsSync(this.traefikDynamicDir)) {
        fs.mkdirSync(this.traefikDynamicDir, { recursive: true });
      }
      fs.writeFileSync(destPath, yaml.dump(traefikConfig), 'utf8');
      return destPath;
    } catch (err) {
      throw new LifecycleError(`Failed to generate Traefik dynamic configuration for ${tenantId}: ${err.message}`, { rootCause: err });
    }
  }

  destroy(tenantId) {
    const destPath = path.join(this.traefikDynamicDir, `tenant-${tenantId}.yml`);
    try {
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }
    } catch (err) {
      console.error(`Failed to clean Traefik dynamic configuration for ${tenantId}:`, err.message);
    }
  }
}

module.exports = {
  DnsGenerator
};
