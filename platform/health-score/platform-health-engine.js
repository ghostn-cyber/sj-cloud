const fs = require('fs');
const path = require('path');
const { globalHealthScore } = require('./health-score');
const { globalInventoryManager } = require('../inventory/inventory-manager');
const { globalBackupCatalog } = require('../backups/backup-catalog');
const { globalPolicyEngine } = require('../policy-engine/policy-engine');

class PlatformHealthEngine {
  getDetailedHealth() {
    const baseScoreObj = globalHealthScore.getOverallScore();
    let score = baseScoreObj.platform;

    // Evaluate sub-systems
    const subSystems = {
      infrastructure: 'GREEN',
      networking: 'GREEN',
      storage: 'GREEN',
      applications: 'GREEN',
      pipelines: 'GREEN',
      monitoring: 'GREEN',
      security: 'GREEN',
      backups: 'GREEN',
      certificates: 'GREEN',
      secrets: 'GREEN'
    };

    // 1. Certificates Check
    const certPath = path.resolve(__dirname, '../../infrastructure/certificates/sj-cloud.test.crt');
    if (!fs.existsSync(certPath)) {
      subSystems.certificates = 'RED';
      score = Math.max(0, score - 20);
    } else {
      try {
        const stats = fs.statSync(certPath);
        if (stats.size === 0) {
          subSystems.certificates = 'RED';
          score = Math.max(0, score - 20);
        }
      } catch (e) {
        subSystems.certificates = 'ORANGE';
      }
    }

    // 2. Secrets Check
    const secretsDir = path.resolve(__dirname, '../../infrastructure/secrets');
    const requiredSecrets = [
      'postgres_password',
      'redis_password',
      'minio_root_user',
      'minio_root_password',
      'grafana_admin_password',
      'jwt_secret',
      'encryption_key'
    ];
    let missingSecrets = 0;
    for (const secret of requiredSecrets) {
      const p = path.join(secretsDir, secret);
      if (!fs.existsSync(p) || fs.statSync(p).size === 0) {
        missingSecrets++;
      }
    }
    if (missingSecrets > 0) {
      subSystems.secrets = 'RED';
      score = Math.max(0, score - (missingSecrets * 10));
    }

    // 3. Backups Check
    try {
      const backups = globalBackupCatalog.getBackups();
      if (!backups || backups.length === 0) {
        subSystems.backups = 'YELLOW';
      } else {
        const latest = backups[0];
        const ageHours = (Date.now() - new Date(latest.timestamp).getTime()) / 3600000;
        if (ageHours > 24) {
          subSystems.backups = 'ORANGE';
          score = Math.max(0, score - 5);
        }
      }
    } catch (e) {
      subSystems.backups = 'YELLOW';
    }

    // 4. Security Policy Check
    try {
      const policies = globalPolicyEngine.policies || [];
      const failing = policies.filter(p => p.status === 'FAIL');
      if (failing.length > 0) {
        subSystems.security = failing.length > 2 ? 'RED' : 'ORANGE';
        score = Math.max(0, score - (failing.length * 5));
      }
    } catch (e) {
      subSystems.security = 'GREEN';
    }

    // Ensure score is within [0, 100]
    score = Math.max(0, Math.min(score, 100));

    // Overall Status Color
    let status = 'GREEN';
    if (score < 50) {
      status = 'RED';
    } else if (score < 75) {
      status = 'ORANGE';
    } else if (score < 90) {
      status = 'YELLOW';
    }

    return {
      timestamp: new Date().toISOString(),
      score,
      status,
      subSystems,
      metrics: {
        platform: score,
        tenant: baseScoreObj.tenant,
        application: baseScoreObj.application,
        deployment: baseScoreObj.deployment,
        pipeline: baseScoreObj.pipeline
      }
    };
  }
}

const globalPlatformHealthEngine = new PlatformHealthEngine();

module.exports = {
  PlatformHealthEngine,
  globalPlatformHealthEngine
};
