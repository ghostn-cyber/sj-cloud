class PolicyLoader {
  loadDefaultPolicies() {
    return [
      {
        name: 'RequiredTestAndScanPolicy',
        evaluate(context) {
          const config = context.pipelineConfig;
          if (!config || !config.stages) return { allowed: true };
          const stageNames = config.stages.map(s => s.name.toLowerCase());
          const hasTest = stageNames.includes('test');
          const hasScan = stageNames.includes('scan') || stageNames.includes('security scan') || stageNames.includes('security-scan');
          
          if (!hasTest) {
            return { allowed: false, reason: 'Pipeline configuration is missing a required "Test" stage.' };
          }
          if (!hasScan) {
            return { allowed: false, reason: 'Pipeline configuration is missing a required "Scan" stage.' };
          }
          return { allowed: true };
        }
      },
      {
        name: 'BranchProtectionPolicy',
        evaluate(context) {
          const details = context.details;
          if (details.environment === 'production' && details.branch !== 'main' && details.branch !== 'master') {
            return { allowed: false, reason: `Deploying branch "${details.branch}" directly to production is prohibited by BranchProtectionPolicy.` };
          }
          return { allowed: true };
        }
      }
    ];
  }
}

module.exports = {
  PolicyLoader
};
