const fs = require('fs');
const path = require('path');

class PipelineState {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
    this.activeRuns = new Map();
  }

  getRunDir(tenantId, pipelineId) {
    return path.join(this.tenantsDir, tenantId, 'pipelines', pipelineId);
  }

  saveRun(tenantId, pipelineId, runData) {
    const runDir = this.getRunDir(tenantId, pipelineId);
    if (!fs.existsSync(runDir)) {
      fs.mkdirSync(runDir, { recursive: true });
    }
    const runJsonPath = path.join(runDir, 'run.json');
    fs.writeFileSync(runJsonPath, JSON.stringify(runData, null, 2), 'utf8');
    this.activeRuns.set(pipelineId, runData);
    return runData;
  }

  getRun(tenantId, pipelineId) {
    if (this.activeRuns.has(pipelineId)) {
      return this.activeRuns.get(pipelineId);
    }
    const runJsonPath = path.join(this.getRunDir(tenantId, pipelineId), 'run.json');
    if (!fs.existsSync(runJsonPath)) return null;
    const runData = JSON.parse(fs.readFileSync(runJsonPath, 'utf8'));
    this.activeRuns.set(pipelineId, runData);
    return runData;
  }

  getAllRuns(tenantId) {
    const runs = [];
    const pipelinesDir = path.join(this.tenantsDir, tenantId, 'pipelines');
    if (fs.existsSync(pipelinesDir) && fs.statSync(pipelinesDir).isDirectory()) {
      const dirs = fs.readdirSync(pipelinesDir);
      for (const pipelineId of dirs) {
        const runJsonPath = path.join(pipelinesDir, pipelineId, 'run.json');
        if (fs.existsSync(runJsonPath)) {
          runs.push(JSON.parse(fs.readFileSync(runJsonPath, 'utf8')));
        }
      }
    }
    return runs;
  }
}

const globalPipelineState = new PipelineState();

module.exports = {
  PipelineState,
  globalPipelineState
};
