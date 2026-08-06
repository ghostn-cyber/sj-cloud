class SpanBuilder {
  constructor(spanManager, name, traceId, parentSpanId = null) {
    this.spanManager = spanManager;
    this.name = name;
    this.traceId = traceId;
    this.parentSpanId = parentSpanId;
    this.spanId = require('./trace-context').TraceContext.generateSpanId();
    this.startTime = Date.now();
    this.endTime = null;
    this.attributes = {};
    this.status = 'UNSET'; // UNSET, OK, ERROR
  }

  setAttribute(key, value) {
    this.attributes[key] = value;
    return this;
  }

  setAttributes(attrs = {}) {
    Object.assign(this.attributes, attrs);
    return this;
  }

  setStatus(status) {
    this.status = status;
    return this;
  }

  end() {
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
    this.spanManager.recordSpan(this);
    return this;
  }
}

module.exports = {
  SpanBuilder
};
