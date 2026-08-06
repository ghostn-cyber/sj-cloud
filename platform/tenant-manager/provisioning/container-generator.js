const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { LifecycleError } = require('../../shared/errors');
const { NetworkConfig } = require('../../shared/config/config-context');

class ContainerGenerator {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../tenants');
  }

  generate(tenantId, env) {
    const tenantDir = path.join(this.tenantsDir, tenantId);
    
    const appDir = path.join(tenantDir, 'app');
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }
    const serverScript = `
const http = require('http');
const port = process.env.PORT || 80;

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/healthz' || req.url === '/ready') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', tenant: process.env.TENANT_ID }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(\`<h1>Welcome to SJ Cloud Tenant: \${process.env.TENANT_ID || 'Unknown'}</h1>\`);
});

server.listen(port, () => {
  console.log(\`Tenant application listening on port \${port}\`);
});
`;
    fs.writeFileSync(path.join(appDir, 'server.js'), serverScript, 'utf8');

    const composeConfig = {
      services: {
        [`tenant-${tenantId}`]: {
          image: 'node:18-alpine',
          container_name: `sj-tenant-${tenantId}`,
          restart: 'unless-stopped',
          working_dir: '/usr/src/app',
          command: 'node server.js',
          volumes: [
            './app:/usr/src/app',
            './data:/usr/src/app/data',
            './logs:/usr/src/app/logs'
          ],
          environment: {
            NODE_ENV: env.NODE_ENV || 'production',
            PORT: '80',
            TENANT_ID: tenantId,
            DATABASE_HOST: env.DATABASE_HOST || 'localhost',
            DATABASE_PORT: String(env.DATABASE_PORT || 5432),
            DATABASE_NAME: env.DATABASE_NAME || '',
            DATABASE_USER: env.DATABASE_USER || '',
            DATABASE_PASSWORD: env.DATABASE_PASSWORD || '',
            JWT_SECRET: env.JWT_SECRET || ''
          },
          networks: [
            NetworkConfig.PROXY_NETWORK,
            `sj-tenant-${tenantId}`
          ],
          labels: {
            platform: 'sj-cloud',
            layer: 'tenant-runtime',
            tenant: tenantId,
            'traefik.enable': 'true',
            'traefik.docker.network': NetworkConfig.PROXY_NETWORK
          }
        }
      },
      networks: {
        [NetworkConfig.PROXY_NETWORK]: {
          external: true
        },
        [`sj-tenant-${tenantId}`]: {
          driver: 'bridge'
        }
      }
    };

    const composePath = path.join(tenantDir, 'docker-compose.yml');
    try {
      fs.writeFileSync(composePath, yaml.dump(composeConfig), 'utf8');
      return composePath;
    } catch (err) {
      throw new LifecycleError(`Failed to generate docker-compose file for tenant ${tenantId}: ${err.message}`, { rootCause: err });
    }
  }
}

module.exports = {
  ContainerGenerator
};
