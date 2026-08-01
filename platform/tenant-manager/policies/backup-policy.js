class BackupPolicy {
  evaluate(action, tenantId, params = {}) {
    if (action === 'provision') {
      const backupConfig = params.policies && params.policies.backup_schedule;
      if (backupConfig) {
        // Simple cron schedule validation (e.g. "0 0 * * *")
        const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/[0-9]+)\s+(\*|([0-9]|1[0-9]|2[0-9])|\*\/[0-9]+)\s+(\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/[0-9]+)\s+(\*|([1-9]|1[0-2])|\*\/[0-9]+)\s+(\*|([0-7])|\*\/[0-9]+)$/;
        if (!cronRegex.test(backupConfig)) {
          return { allowed: false, reason: `Backup schedule cron format is invalid: ${backupConfig}` };
        }
      }

      const retention = params.policies && params.policies.retention_policy;
      if (retention && retention.days !== undefined) {
        if (retention.days < 1 || retention.days > 365) {
          return { allowed: false, reason: 'Backup retention days must be between 1 and 365' };
        }
      }
    }
    return { allowed: true };
  }
}

module.exports = { BackupPolicy };
