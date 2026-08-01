const crypto = require('crypto');

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
  // parts[0] is version, parts[1] is traceId, parts[2] is parentSpanId, parts[3] is flags
  return {
    traceId: parts[1],
    parentSpanId: parts[2],
    spanId: generateHex(8) // generate new span ID for this hop
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
  
  // Create fresh trace context
  return {
    traceId: generateHex(16),
    spanId: generateHex(8),
    parentSpanId: ''
  };
}

module.exports = {
  generateHex,
  parseTraceparent,
  extractOrCreateContext
};
