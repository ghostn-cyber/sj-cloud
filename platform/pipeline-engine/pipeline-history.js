const fs = require('fs');
const path = require('path');

class PipelineHistory {
  constructor(tenantsDir) {
    this.tenantsDir = tenantsDir || path.resolve(__dirname, '../../../../tenants');
  }

  logHistory(tenantId, pipelineId, eventType, details) {
    const pipelinesDir = path.join(this.tenantsDir, tenantId, 'pipelines');
    if (!fs.existsSync(pipelinesDir)) {
      fs.mkdirSync(pipelinesDir, { recursive: true });
    }
    const logPath = path.join(pipelinesDir, 'history.log');
    const entry = {
      timestamp: new Date().toISOString(),
      pipelineId,
      eventType,
      details
    };
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
  }

  getHistory(tenantId) {
    const logPath = path.join(this.tenantsDir, tenantId, 'pipelines', 'history.log');
    if (!fs.existsSync(logPath)) return [];
    const content = fs.readFileSync(logPath, 'utf8').trim();
    if (!content) return [];
    return content.split('\n').map(line => JSON.parse(line));
  }
}

const globalPipelineHistory = new PipelineHistory();

module.exports = {
  PipelineHistory,
  globalPipelineHistory
};
