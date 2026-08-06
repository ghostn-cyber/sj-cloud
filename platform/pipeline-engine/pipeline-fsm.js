const { PipelineEvents } = require('./pipeline-events');

const PipelineStates = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

const VALID_TRANSITIONS = {
  [PipelineStates.QUEUED]: [PipelineStates.RUNNING, PipelineStates.CANCELLED],
  [PipelineStates.RUNNING]: [PipelineStates.SUCCESS, PipelineStates.FAILED, PipelineStates.CANCELLED],
  [PipelineStates.SUCCESS]: [],
  [PipelineStates.FAILED]: [],
  [PipelineStates.CANCELLED]: []
};

const fsmMetrics = {
  pipeline_runs_total: 0,
  pipeline_runs_success: 0,
  pipeline_runs_failed: 0,
  pipeline_runs_cancelled: 0
};

class PipelineFSM {
  constructor(pipelineId, tenantId, currentState = PipelineStates.QUEUED) {
    this.pipelineId = pipelineId;
    this.tenantId = tenantId;
    this.state = currentState;
  }

  getState() {
    return this.state;
  }

  transitionTo(toState, details = {}) {
    const allowed = VALID_TRANSITIONS[this.state];
    if (allowed && !allowed.includes(toState)) {
      throw new Error(`Invalid pipeline transition from ${this.state} to ${toState} for pipeline ${this.pipelineId}`);
    }

    const oldState = this.state;
    this.state = toState;

    // Track metrics
    if (toState === PipelineStates.RUNNING && oldState === PipelineStates.QUEUED) {
      fsmMetrics.pipeline_runs_total++;
    }
    if (toState === PipelineStates.SUCCESS) {
      fsmMetrics.pipeline_runs_success++;
    }
    if (toState === PipelineStates.FAILED) {
      fsmMetrics.pipeline_runs_failed++;
    }
    if (toState === PipelineStates.CANCELLED) {
      fsmMetrics.pipeline_runs_cancelled++;
    }

    // Publish event mapping to the expected lifecycle event types
    let eventName = 'PipelineStarted';
    if (toState === PipelineStates.SUCCESS) eventName = 'PipelineCompleted';
    if (toState === PipelineStates.FAILED) eventName = 'PipelineFailed';
    if (toState === PipelineStates.CANCELLED) eventName = 'PipelineCancelled';

    PipelineEvents.emit(eventName, this.pipelineId, this.tenantId, {
      oldState,
      newState: toState,
      ...details
    });

    return this.state;
  }

  static getMetrics() {
    return fsmMetrics;
  }
}

module.exports = {
  PipelineFSM,
  PipelineStates
};
