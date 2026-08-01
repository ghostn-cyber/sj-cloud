class Tracer {
  static parseTraceparent(header) {
    if (!header) return null;
    const parts = header.split('-');
    if (parts.length === 4 && parts[0] === '00') {
      return {
        traceId: parts[1],
        spanId: parts[2],
        flags: parts[3]
      };
    }
    return null;
  }

  static generateTraceId() {
    return Math.random().toString(16).substring(2, 18).padStart(16, '0') +
           Math.random().toString(16).substring(2, 18).padStart(16, '0');
  }

  static generateSpanId() {
    return Math.random().toString(16).substring(2, 18).padStart(16, '0');
  }

  static formatTraceparent(traceId, spanId) {
    return `00-${traceId}-${spanId}-01`;
  }
}

module.exports = Tracer;
