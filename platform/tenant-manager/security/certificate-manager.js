const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { CertificateGenerator } = require('../provisioning/certificate-generator');
const { TenantEvents } = require('../registry/tenant-events');

const certificateMetrics = {
  tenant_certificate_expiry: {}
};

class CertificateManager {
  constructor(certsDir) {
    this.certsDir = certsDir || path.resolve(__dirname, '../../../../infrastructure/traefik/certificates/development');
    this.generator = new CertificateGenerator(this.certsDir);
  }

  getCertStatus(tenantId) {
    const certPath = path.join(this.certsDir, `tenant-${tenantId}.crt`);
    if (!fs.existsSync(certPath)) {
      return { status: 'failed', message: 'Certificate file missing', diffDays: 0 };
    }

    try {
      const out = execSync(`openssl x509 -enddate -noout -in "${certPath}"`, { stdio: 'pipe' }).toString().trim();
      const match = out.match(/notAfter=(.*)$/);
      if (match) {
        const expiryDate = new Date(match[1]);
        const diffMs = expiryDate.getTime() - Date.now();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        certificateMetrics.tenant_certificate_expiry[tenantId] = diffDays;

        if (diffDays <= 0) {
          return { status: 'expired', expiryDate, diffDays };
        } else if (diffDays <= 30) {
          return { status: 'renewing', expiryDate, diffDays };
        } else {
          return { status: 'issued', expiryDate, diffDays };
        }
      }
    } catch {
      const stats = fs.statSync(certPath);
      const expiryDate = new Date(stats.mtime.getTime() + 365 * 24 * 60 * 60 * 1000);
      const diffMs = expiryDate.getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      certificateMetrics.tenant_certificate_expiry[tenantId] = diffDays;

      if (diffDays <= 0) return { status: 'expired', expiryDate, diffDays };
      if (diffDays <= 30) return { status: 'renewing', expiryDate, diffDays };
      return { status: 'issued', expiryDate, diffDays };
    }

    return { status: 'failed', message: 'Could not parse certificate', diffDays: 0 };
  }

  async renewCertificate(tenantId, primaryDomain) {
    console.log(`[CertificateManager] Renewing certificate for tenant: ${tenantId}...`);
    try {
      this.generator.generate(tenantId, primaryDomain);
      TenantEvents.emit('TENANT_CERTIFICATE_RENEWED', tenantId);
      console.log(`[CertificateManager] Successfully renewed certificate for tenant: ${tenantId}`);
      return { success: true };
    } catch (err) {
      console.error(`[CertificateManager] Failed to renew certificate for ${tenantId}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  static getMetrics() {
    return certificateMetrics;
  }
}

module.exports = {
  CertificateManager,
  certificateMetrics
};
