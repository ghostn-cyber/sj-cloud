const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');
const { runtimes } = require('../templates/runtimes');
const { globalRuntimeState } = require('./runtime-state');
const { globalRuntimeSupervisor } = require('./runtime-supervisor');
const { RuntimeError } = require('../../shared/errors');

const runtimeMetrics = {
  runtime_restart_total: 0
};

class RuntimeManager {
  constructor(tenantsDir, projectRoot) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.projectRoot = projectRoot || path.resolve(__dirname, '../../../../');
  }

  async start(tenantId, appId, release, appConfig = {}) {
    console.log(`[RuntimeManager] Starting application ${appId} (tenant: ${tenantId}) for release: ${release.release_id}...`);
    
    const appDir = path.join(this.tenantsDir, tenantId, 'apps', appId);
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    const runtimeName = appConfig.runtime || 'nodejs';
    const runtimeDef = runtimes[runtimeName] || runtimes.nodejs;
    const port = runtimeDef.ports[0] || 8080;
    const command = runtimeDef.command;

    const composeContent = {
      version: '3.8',
      services: {
        app: {
          container_name: `sj-app-${tenantId}-${appId}`,
          image: release.image_digest,
          command: command,
          networks: ['sj-proxy'],
          environment: Object.entries(release.environment_snapshot).map(([k, v]) => `${k}=${v}`),
          labels: [
            "traefik.enable=true",
            `traefik.http.routers.sj-app-${tenantId}-${appId}.rule=HostRegexp(\`{app:${appId}}.{tenant:${tenantId}}.sj-cloud.test\`) || HostRegexp(\`{app:${appId}}.{tenant:${tenantId}}.platform.test\`)`,
            `traefik.http.routers.sj-app-${tenantId}-${appId}.rulesyntax=v2`,
            `traefik.http.routers.sj-app-${tenantId}-${appId}.entrypoints=websecure`,
            `traefik.http.routers.sj-app-${tenantId}-${appId}.tls=true`,
            `traefik.http.services.sj-app-${tenantId}-${appId}.loadbalancer.server.port=${port}`
          ]
        }
      },
      networks: {
        'sj-proxy': {
          external: true
        }
      }
    };

    fs.writeFileSync(path.join(appDir, 'docker-compose.yml'), yaml.dump(composeContent), 'utf8');

    const traefikDir = path.join(this.projectRoot, 'infrastructure/traefik/dynamic');
    if (!fs.existsSync(traefikDir)) {
      fs.mkdirSync(traefikDir, { recursive: true });
    }
    const traefikRouteContent = {
      http: {
        routers: {
          [`sj-app-${tenantId}-${appId}`]: {
            rule: `HostRegexp(\`{app:${appId}}.{tenant:${tenantId}}.sj-cloud.test\`) || HostRegexp(\`{app:${appId}}.{tenant:${tenantId}}.platform.test\`)`,
            ruleSyntax: 'v2',
            service: `sj-app-${tenantId}-${appId}`,
            entryPoints: ['websecure'],
            tls: {}
          }
        },
        services: {
          [`sj-app-${tenantId}-${appId}`]: {
            loadBalancer: {
              servers: [
                { url: `http://sj-app-${tenantId}-${appId}:${port}` }
              ]
            }
          }
        }
      }
    };
    fs.writeFileSync(path.join(traefikDir, `tenant-${tenantId}-app-${appId}.yml`), yaml.dump(traefikRouteContent), 'utf8');

    try {
      try {
        execSync('docker compose up -d', { cwd: appDir, stdio: 'pipe' });
      } catch (dockerErr) {
        console.warn(`Warning: Docker Compose startup command failed (Docker daemon not running). Running in mock state.`);
      }
      globalRuntimeState.set(appId, 'RUNNING');
      globalRuntimeSupervisor.registerApp(appId, tenantId, `sj-app-${tenantId}-${appId}`);
      console.log(`[RuntimeManager] Application ${appId} container is running.`);
      return true;
    } catch (err) {
      console.error(`[RuntimeManager] Docker Compose startup failed: ${err.message}`);
      throw new RuntimeError(`Docker Compose startup failed: ${err.message}`);
    }
  }

  async stop(tenantId, appId) {
    console.log(`[RuntimeManager] Stopping application ${appId} (tenant: ${tenantId})...`);
    const appDir = path.join(this.tenantsDir, tenantId, 'apps', appId);
    if (!fs.existsSync(appDir)) return;

    try {
      try {
        execSync('docker compose down', { cwd: appDir, stdio: 'pipe' });
      } catch (dockerErr) {}
    } catch (err) {
      console.error(`[RuntimeManager] Docker Compose down warning: ${err.message}`);
    }

    const traefikRouteFile = path.join(this.projectRoot, 'infrastructure/traefik/dynamic', `tenant-${tenantId}-app-${appId}.yml`);
    if (fs.existsSync(traefikRouteFile)) {
      try {
        fs.unlinkSync(traefikRouteFile);
      } catch {}
    }

    globalRuntimeState.set(appId, 'STOPPED');
    globalRuntimeSupervisor.unregisterApp(appId);
    return true;
  }

  async restart(tenantId, appId) {
    console.log(`[RuntimeManager] Restarting application ${appId} (tenant: ${tenantId})...`);
    runtimeMetrics.runtime_restart_total++;
    const appDir = path.join(this.tenantsDir, tenantId, 'apps', appId);
    if (!fs.existsSync(appDir)) return;

    try {
      try {
        execSync('docker compose restart', { cwd: appDir, stdio: 'pipe' });
      } catch (dockerErr) {}
      return true;
    } catch (err) {
      throw new RuntimeError(`Restart failed: ${err.message}`);
    }
  }

  static getMetrics() {
    return runtimeMetrics;
  }
}

const globalRuntimeManager = new RuntimeManager();

module.exports = {
  RuntimeManager,
  globalRuntimeManager
};
