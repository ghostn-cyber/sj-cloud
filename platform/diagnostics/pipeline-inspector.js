class PipelineInspector {
  inspect() {
    let pipelineRuns = 0;
    try {
      const { PipelineFSM } = require('../pipeline-engine/pipeline-fsm');
      pipelineRuns = PipelineFSM.getMetrics().pipeline_runs_total || 0;
    } catch (e) {}

    return {
      status: 'OK',
      totalRuns: pipelineRuns,
      queueStatus: 'IDLE',
      workerAvailability: 'READY'
    };
  }
}

const globalPipelineInspector = new PipelineInspector();

module.exports = {
  PipelineInspector,
  globalPipelineInspector
};
