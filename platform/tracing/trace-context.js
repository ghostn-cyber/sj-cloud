const crypto = require('crypto');

class TraceContext {
  static generateId(bytes) {
    return crypto.randomBytes(bytes).toString('hex');
  }

  static generateTraceId() {
    return this.generateId(16); // 32 hex chars
  }

  static generateSpanId() {
    return this.generateId(8); // 16 hex chars
  }

  static parseTraceParent(headerVal) {
    if (!headerVal) return null;
    const parts = headerVal.split('-');
    if (parts.length < 4) return null;
    return {
      version: parts[0],
      traceId: parts[1],
      spanId: parts[2],
      traceFlags: parts[3]
    };
  }

  static formatTraceParent(traceId, spanId, flags = '00') {
    return `00-${traceId}-${spanId}-${flags}`;
  }
}

module.exports = {
  TraceContext
};
