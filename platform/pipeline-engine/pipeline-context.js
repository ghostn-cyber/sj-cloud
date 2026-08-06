class PipelineContext {
  constructor(pipelineId, tenantId, appId, config = {}) {
    this.pipelineId = pipelineId;
    this.tenantId = tenantId;
    this.appId = appId;
    this.config = config;
    this.env = { ...config.env };
    this.artifacts = [];
    this.stages = {};
    this.status = 'QUEUED';
    this.startTime = null;
    this.endTime = null;
    this.error = null;
  }

  setEnv(key, val) {
    this.env[key] = val;
  }

  getEnv(key) {
    return this.env[key];
  }

  addArtifact(artifact) {
    this.artifacts.push(artifact);
  }

  startStage(stageName) {
    this.stages[stageName] = {
      status: 'RUNNING',
      startTime: new Date().toISOString(),
      endTime: null,
      steps: []
    };
  }

  completeStage(stageName, status = 'SUCCESS') {
    if (this.stages[stageName]) {
      this.stages[stageName].status = status;
      this.stages[stageName].endTime = new Date().toISOString();
    }
  }

  addStepResult(stageName, stepName, status, duration, logs) {
    if (this.stages[stageName]) {
      this.stages[stageName].steps.push({
        name: stepName,
        status,
        duration,
        logs
      });
    }
  }

  toJSON() {
    return {
      pipelineId: this.pipelineId,
      tenantId: this.tenantId,
      appId: this.appId,
      status: this.status,
      startTime: this.startTime,
      endTime: this.endTime,
      env: this.env,
      artifacts: this.artifacts,
      stages: this.stages,
      error: this.error
    };
  }
}

module.exports = {
  PipelineContext
};
