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
    const hostRules = [];
    let usesRegexp = false;

    for (const d of domains) {
      if (d.endsWith('.sj-cloud.test') || d.endsWith('.platform.test')) {
        const subdomain = d.split('.')[0];
        hostRules.push(`HostRegexp(\`{tenant:${subdomain}}.sj-cloud.test\`)`);
        hostRules.push(`HostRegexp(\`{tenant:${subdomain}}.platform.test\`)`);
        usesRegexp = true;
      } else {
        hostRules.push(`Host(\`${d}\`)`);
      }
    }
    const hostRule = hostRules.join(' || ');

    const traefikConfig = {
      http: {
        routers: {
          [`tenant-${tenantId}`]: {
            entryPoints: ['web'],
            rule: hostRule,
            service: `tenant-${tenantId}-service`,
            ...(usesRegexp ? { ruleSyntax: 'v2' } : {})
          },
          [`tenant-${tenantId}-secure`]: {
            entryPoints: ['websecure'],
            rule: hostRule,
            service: `tenant-${tenantId}-service`,
            ...(usesRegexp ? { ruleSyntax: 'v2' } : {}),
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
