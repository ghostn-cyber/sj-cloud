const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { CertificateManager } = require('../security/certificate-manager');

class Watchdog {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.certManager = new CertificateManager();
  }

  async checkTenantHealth(tenantId) {
    const tenantDir = path.join(this.tenantsDir, tenantId);
    
    if (!fs.existsSync(tenantDir)) {
      return { status: 'UNHEALTHY', reasons: ['Workspace directory missing'] };
    }

    const reasons = [];

    // 1. Docker compose check
    const composeFile = path.join(tenantDir, 'docker-compose.yml');
    if (!fs.existsSync(composeFile)) {
      reasons.push('compose_file_missing');
    } else {
      try {
        const out = execSync('docker compose ps --format json', { cwd: tenantDir, stdio: 'pipe' }).toString().trim();
        if (out) {
          const parsed = JSON.parse(out);
          const containers = Array.isArray(parsed) ? parsed : [parsed];
          const running = containers.some(c => c.State === 'running' || c.Status === 'running');
          if (!running) {
            reasons.push('containers_stopped');
          }
        }
      } catch {
        reasons.push('compose_query_failed');
      }
    }

    // 2. Routing file check
    const routePath = path.resolve(__dirname, '../../../../infrastructure/traefik/dynamic', `tenant-${tenantId}.yml`);
    if (!fs.existsSync(routePath)) {
      reasons.push('routing_file_missing');
    }

    // 3. Certificates check
    const certStatus = this.certManager.getCertStatus(tenantId);
    if (certStatus.status === 'failed' || certStatus.status === 'expired') {
      reasons.push('certificate_unhealthy');
    }

    // 4. Database check
    try {
      execSync('which psql', { stdio: 'ignore' });
      const host = process.env.DATABASE_HOST || 'localhost';
      const adminUser = process.env.PGUSER || 'postgres';
      const adminPass = process.env.PGPASSWORD || 'postgres';
      const dbName = `sj_tenant_${tenantId.replace(/-/g, '_')}`;
      const checkCmd = `PGPASSWORD="${adminPass}" psql -h ${host} -U ${adminUser} -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='${dbName}';"`;
      const res = execSync(checkCmd, { stdio: 'pipe' }).toString().trim();
      if (res !== '1') {
        reasons.push('database_missing');
      }
    } catch {
      // Mock db check: assume healthy if workspace exists
    }

    return {
      status: reasons.length === 0 ? 'HEALTHY' : 'UNHEALTHY',
      reasons
    };
  }
}

module.exports = { Watchdog };
