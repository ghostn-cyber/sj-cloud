const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ActualState {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  get(tenantId) {
    const tenantDir = path.join(this.tenantsDir, tenantId);
    const workspaceExists = fs.existsSync(tenantDir);
    const composeFileExists = workspaceExists && fs.existsSync(path.join(tenantDir, 'docker-compose.yml'));
    
    let composeRunning = false;
    let containerStatus = 'stopped';
    if (composeFileExists) {
      try {
        const out = execSync('docker compose ps --format json', { cwd: tenantDir, stdio: 'pipe' }).toString().trim();
        if (out) {
          // Parse lines or array
          const parsed = JSON.parse(out);
          const containers = Array.isArray(parsed) ? parsed : [parsed];
          if (containers.length > 0) {
            composeRunning = containers.some(c => c.State === 'running' || c.Status === 'running');
            containerStatus = containers[0].State || containers[0].Status || 'stopped';
          }
        }
      } catch (err) {
        // Fallback check: look if docker container is active
        try {
          const containerName = `tenant-${tenantId}-app`;
          const inspectOut = execSync(`docker inspect -f '{{.State.Status}}' ${containerName}`, { stdio: 'pipe' }).toString().trim();
          composeRunning = inspectOut === 'running';
          containerStatus = inspectOut;
        } catch (_) {}
      }
    }

    const routePath = path.resolve(__dirname, '../../../../infrastructure/traefik/dynamic', `tenant-${tenantId}.yml`);
    const routeExists = fs.existsSync(routePath);

    const certsDir = path.resolve(__dirname, '../../../../infrastructure/traefik/certificates/development');
    const keyPath = path.join(certsDir, `tenant-${tenantId}.key`);
    const crtPath = path.join(certsDir, `tenant-${tenantId}.crt`);
    const certsExist = fs.existsSync(keyPath) && fs.existsSync(crtPath);

    // Database existence check using PG administration credentials if psql is present
    let dbExists = false;
    try {
      execSync('which psql', { stdio: 'ignore' });
      const { DatabaseConfig, SecurityConfig } = require('../../shared/config/config-context');
      const host = DatabaseConfig.POSTGRES_HOST || 'localhost';
      const adminUser = 'postgres';
      const adminPass = SecurityConfig.POSTGRES_PASSWORD || 'postgres';
      const dbName = `sj_tenant_${tenantId.replace(/-/g, '_')}`;
      
      const checkCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='${dbName}';"`;
      const res = execSync(checkCmd, { stdio: 'pipe' }).toString().trim();
      dbExists = res === '1';
    } catch {
      // Mock db check: if workspace exists, assume DB exists
      dbExists = workspaceExists;
    }

    // Secrets file existence
    const secretsExist = workspaceExists && fs.existsSync(path.join(tenantDir, 'secrets.json'));

    return {
      workspaceExists,
      composeFileExists,
      composeRunning,
      containerStatus,
      routeExists,
      certsExist,
      dbExists,
      secretsExist
    };
  }
}

module.exports = { ActualState };
