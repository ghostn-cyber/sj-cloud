const { globalInventoryManager } = require('../../inventory/inventory-manager');
const { globalDriftDetector } = require('../../drift/drift-detector');
const { globalPolicyEngine } = require('../../policy-engine/policy-engine');
const { globalQuotaManager } = require('../../quota/quota-manager');
const { globalBackupCatalog } = require('../../backups/backup-catalog');
const { globalDisasterRecoveryEngine } = require('../../disaster-recovery/dr-engine');
const { globalImageGovernanceManager } = require('../../image-governance/governance-manager');

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
  });
}

async function handleInfrastructureRoute(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (!pathname.startsWith('/admin/infrastructure')) return false;

  const adminSub = pathname.substring(21); // Extract after '/admin/infrastructure'

  if ((adminSub === '/health' || adminSub === 'health') && req.method === 'GET') {
    try {
      const { globalPlatformHealthEngine } = require('../../health-score/platform-health-engine');
      res.statusCode = 200;
      res.end(JSON.stringify(globalPlatformHealthEngine.getDetailedHealth()));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  if ((adminSub === '/audit' || adminSub === 'audit') && req.method === 'GET') {
    try {
      const fs = require('fs');
      const path = require('path');
      const tenantsDir = path.resolve(__dirname, '../../../../tenants');
      let allLogs = [];
      if (fs.existsSync(tenantsDir)) {
        const tenants = fs.readdirSync(tenantsDir);
        for (const tenantId of tenants) {
          const auditPath = path.join(tenantsDir, tenantId, 'audit.json');
          if (fs.existsSync(auditPath)) {
            try {
              const logs = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
              if (Array.isArray(logs)) {
                allLogs = allLogs.concat(logs);
              }
            } catch (e) {}
          }
        }
      }
      allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      res.statusCode = 200;
      res.end(JSON.stringify(allLogs));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  if ((adminSub === '/inventory' || adminSub === 'inventory') && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalInventoryManager.discover()));
    return true;
  }

  if ((adminSub === '/drift' || adminSub === 'drift') && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalDriftDetector.detectDrift()));
    return true;
  }

  if ((adminSub === '/policies' || adminSub === 'policies') && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(globalPolicyEngine.policies));
    return true;
  }

  if ((adminSub === '/backups' || adminSub === 'backups') && req.method === 'GET') {
    const tenantId = parsedUrl.searchParams.get('tenantId');
    res.statusCode = 200;
    res.end(JSON.stringify(globalBackupCatalog.getBackups(tenantId)));
    return true;
  }

  if ((adminSub === '/dr/snapshot' || adminSub === 'dr/snapshot') && req.method === 'POST') {
    try {
      const snap = await globalDisasterRecoveryEngine.createPlatformSnapshot();
      res.statusCode = 201;
      res.end(JSON.stringify(snap));
    } catch (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
    return true;
  }

  if ((adminSub === '/quota' || adminSub === 'quota')) {
    const tenantId = parsedUrl.searchParams.get('tenantId');
    if (!tenantId) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing tenantId param' }));
      return true;
    }
    if (req.method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify(globalQuotaManager.getQuota(tenantId)));
      return true;
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const limits = JSON.parse(body);
      const updated = globalQuotaManager.setQuota(tenantId, limits);
      res.statusCode = 200;
      res.end(JSON.stringify(updated));
      return true;
    }
  }

  if ((adminSub === '/image/validate' || adminSub === 'image/validate') && req.method === 'POST') {
    const body = await readBody(req);
    const { image } = JSON.parse(body);
    if (!image) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Missing image parameter' }));
      return true;
    }
    const check = globalImageGovernanceManager.validateImage(image);
    res.statusCode = 200;
    res.end(JSON.stringify(check));
    return true;
  }

  return false;
}

module.exports = {
  handleInfrastructureRoute
};
