const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { PipelineValidator } = require('./pipeline-validator');
const { globalPipelineRunner } = require('./pipeline-runner');
const { globalPipelineState } = require('./pipeline-state');
const { globalPipelinePolicyEngine } = require('./policies/policy-engine');
const { PolicyContext } = require('./policies/policy-context');
const { PipelineFSM, PipelineStates } = require('./pipeline-fsm');

class PipelineEngine {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.validator = new PipelineValidator();
  }

  async triggerPipeline(tenantId, appId, triggerOpts = {}) {
    const { globalApplicationRegistry } = require('../application-manager/registry/application-registry');
    const app = globalApplicationRegistry.getApplication(appId);
    if (!app) throw new Error(`Application not found: ${appId}`);

    // Load or resolve pipeline configuration. If application has a pipeline definition or uses a template.
    // Let's resolve the template matching the application.
    let pipelineConfig = null;
    const templateName = (app.template || app.runtime || 'node').replace('nodejs', 'node');
    const templatePath = path.resolve(__dirname, '../../templates/pipelines', `${templateName}.yaml`);
    
    if (fs.existsSync(templatePath)) {
      pipelineConfig = yaml.load(fs.readFileSync(templatePath, 'utf8'));
    } else {
      // Fallback default node pipeline
      const defaultPath = path.resolve(__dirname, '../../templates/pipelines/node.yaml');
      if (fs.existsSync(defaultPath)) {
        pipelineConfig = yaml.load(fs.readFileSync(defaultPath, 'utf8'));
      } else {
        // Hardcoded basic config if templates are missing
        pipelineConfig = {
          pipeline_id: `pipe-${Math.random().toString(36).substr(2, 9)}`,
          tenant_id: tenantId,
          application_id: appId,
          trigger: { type: triggerOpts.type || 'push', branch: triggerOpts.branch || 'main' },
          stages: [
            { name: 'Checkout', steps: [{ name: 'git clone', run: 'git clone' }] },
            { name: 'Install', steps: [{ name: 'npm install', run: 'npm install' }] },
            { name: 'Restore Cache', steps: [{ name: 'restore cache', run: 'restore-cache' }] },
            { name: 'Build', steps: [{ name: 'npm run build', run: 'build-engine' }] },
            { name: 'Test', steps: [{ name: 'npm test', run: 'npm test' }] },
            { name: 'Security Scan', steps: [{ name: 'npm audit', run: 'npm audit' }] },
            { name: 'Package', steps: [{ name: 'zip build', run: 'zip build' }] },
            { name: 'Publish Artifact', steps: [{ name: 'publish artifact', run: 'publish-artifact' }] },
            { name: 'Deploy', steps: [{ name: 'deploy', run: 'deploy-engine' }] },
            { name: 'Verify', steps: [{ name: 'verify health', run: 'verify' }] }
          ]
        };
      }
    }

    // Set unique pipeline ID and trigger options
    pipelineConfig.pipeline_id = `pipe-${Math.random().toString(36).substr(2, 9)}`;
    pipelineConfig.tenant_id = tenantId;
    pipelineConfig.application_id = appId;
    pipelineConfig.trigger = {
      type: triggerOpts.type || 'push',
      branch: triggerOpts.branch || 'main'
    };

    // Validate config
    this.validator.validate(pipelineConfig);

    // Evaluate Policies
    const policyContext = new PolicyContext(tenantId, appId, pipelineConfig, {
      branch: triggerOpts.branch || 'main',
      environment: triggerOpts.environment || 'development'
    });
    globalPipelinePolicyEngine.evaluate(policyContext);

    // Execute (asynchronously so as not to block or synchronously for easy testing/flows)
    // Run synchronously to allow tests/scripts to verify results immediately.
    const result = await require('./pipeline-runner').globalPipelineRunner.run(
      pipelineConfig.pipeline_id,
      tenantId,
      appId,
      pipelineConfig
    );
    return result;
  }

  getPipelineRun(tenantId, pipelineId) {
    return globalPipelineState.getRun(tenantId, pipelineId);
  }

  getAllPipelineRuns(tenantId) {
    return globalPipelineState.getAllRuns(tenantId);
  }

  cancelPipelineRun(tenantId, pipelineId) {
    const run = globalPipelineState.getRun(tenantId, pipelineId);
    if (!run) throw new Error(`Pipeline run not found: ${pipelineId}`);
    if (run.status === PipelineStates.SUCCESS || run.status === PipelineStates.FAILED) {
      throw new Error(`Pipeline run already finished`);
    }

    run.status = PipelineStates.CANCELLED;
    run.endTime = new Date().toISOString();
    globalPipelineState.saveRun(tenantId, pipelineId, run);

    const fsm = new PipelineFSM(pipelineId, tenantId, PipelineStates.RUNNING);
    fsm.transitionTo(PipelineStates.CANCELLED, { context: run });

    return run;
  }
}

const globalPipelineEngine = new PipelineEngine();

module.exports = {
  PipelineEngine,
  globalPipelineEngine
};
