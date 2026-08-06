const crypto = require('crypto');
const { logStorage } = require('../observability/logger');
const { globalEventBus } = require('../events');

/**
 * Generate a random hex string of given byte length
 * @param {number} bytes Byte length (e.g. 16 for traceId, 8 for spanId)
 * @returns {string} Hex string
 */
function generateHex(bytes) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Parse traceparent header (W3C standard):
 * 00-{traceId}-{spanId}-{traceFlags}
 * @param {string} traceparent Raw traceparent header value
 * @returns {{traceId: string, parentSpanId: string, spanId: string} | null}
 */
function parseTraceparent(traceparent) {
  if (!traceparent) return null;
  const parts = traceparent.split('-');
  if (parts.length < 4) return null;
  return {
    traceId: parts[1],
    parentSpanId: parts[2],
    spanId: generateHex(8)
  };
}

/**
 * Extract or initialize tracing context from incoming HTTP request
 * @param {Object} headers Request headers
 * @returns {{traceId: string, spanId: string, parentSpanId: string}}
 */
function extractOrCreateContext(headers = {}) {
  const traceparent = headers['traceparent'] || headers['Traceparent'];
  const parsed = parseTraceparent(traceparent);
  if (parsed) {
    return parsed;
  }
  return {
    traceId: generateHex(16),
    spanId: generateHex(8),
    parentSpanId: ''
  };
}

class Span {
  constructor(name, context, parentSpanId = '', tenantId = null) {
    this.name = name;
    this.traceId = context.traceId;
    this.spanId = context.spanId;
    this.parentSpanId = parentSpanId;
    this.tenantId = tenantId;
    this.startTime = new Date().toISOString();
    this.startTimeEpoch = Date.now();
    this.attributes = {};
    this.events = [];
    this.status = { code: 'UNSET' };
  }

  setAttribute(key, val) {
    this.attributes[key] = val;
    return this;
  }

  setAttributes(attrs) {
    Object.assign(this.attributes, attrs);
    return this;
  }

  setStatus(code, message) {
    this.status = { code, message };
    return this;
  }

  end() {
    this.endTime = new Date().toISOString();
    this.endTimeEpoch = Date.now();
    this.durationMs = this.endTimeEpoch - this.startTimeEpoch;

    globalEventBus.publish('SpanEnded', {
      name: this.name,
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      tenantId: this.tenantId,
      startTime: this.startTime,
      endTime: this.endTime,
      durationMs: this.durationMs,
      attributes: this.attributes,
      status: this.status
    });
  }
}

class Tracer {
  startSpan(name, options = {}) {
    const parentContext = options.parentContext || logStorage.getStore() || {};
    const traceId = parentContext.traceId || generateHex(16);
    const parentSpanId = parentContext.spanId || '';
    const spanId = generateHex(8);
    const tenantId = options.tenantId || parentContext.tenantId || null;

    const span = new Span(name, { traceId, spanId }, parentSpanId, tenantId);
    if (options.attributes) {
      span.setAttributes(options.attributes);
    }
    return span;
  }

  async runWithSpan(name, fn, options = {}) {
    const span = this.startSpan(name, options);
    const parentContext = options.parentContext || logStorage.getStore() || {};
    const store = {
      traceId: span.traceId,
      spanId: span.spanId,
      tenantId: span.tenantId || parentContext.tenantId,
      applicationId: options.applicationId || parentContext.applicationId || parentContext.application || null,
      deploymentId: options.deploymentId || parentContext.deploymentId || parentContext.deployment_id || null,
      pipelineId: options.pipelineId || parentContext.pipelineId || parentContext.pipeline_id || null,
      releaseId: options.releaseId || parentContext.releaseId || parentContext.release_id || null,
      requestId: options.requestId || parentContext.requestId || parentContext.request_id || null,
    };
    return logStorage.run(store, async () => {
      try {
        const res = await fn(span);
        span.setStatus('OK');
        return res;
      } catch (err) {
        span.setStatus('ERROR', err.message);
        span.setAttribute('error.type', err.name);
        span.setAttribute('error.message', err.message);
        span.setAttribute('error.stack', err.stack);
        throw err;
      } finally {
        span.end();
      }
    });
  }
}

const globalTracer = new Tracer();

module.exports = {
  generateHex,
  parseTraceparent,
  extractOrCreateContext,
  Span,
  Tracer,
  globalTracer
};
