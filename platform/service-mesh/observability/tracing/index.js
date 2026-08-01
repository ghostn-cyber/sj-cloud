const Tracer = require('../tracer');

class Span {
  constructor(name, parentContext = null) {
    this.name = name;
    this.traceId = parentContext ? parentContext.traceId : Tracer.generateTraceId();
    this.parentSpanId = parentContext ? parentContext.spanId : null;
    this.spanId = Tracer.generateSpanId();
    this.startTime = Date.now();
    this.endTime = null;
    this.attributes = {};
    this.status = 'UNSET';
  }

  setAttribute(key, value) {
    this.attributes[key] = value;
  }

  end() {
    this.endTime = Date.now();
    this.status = 'OK';
  }

  getContext() {
    return {
      traceId: this.traceId,
      spanId: this.spanId
    };
  }

  toTraceparent() {
    return Tracer.formatTraceparent(this.traceId, this.spanId);
  }
}

class Tracing {
  static startSpan(name, parentContext = null) {
    return new Span(name, parentContext);
  }
}

module.exports = {
  Tracing,
  Span,
  Tracer
};
