/**
 * Calculate backoff delay in milliseconds
 * @param {string} type 'immediate', 'linear', 'exponential', 'exponential_jitter'
 * @param {number} attempt Current retry attempt index (1-based)
 * @param {number} baseDelayMs Base delay config
 * @param {number} maxDelayMs Maximum delay clamp config
 * @returns {number} Delay in milliseconds
 */
function calculateBackoff(type, attempt, baseDelayMs = 100, maxDelayMs = 2000) {
  if (attempt <= 0) return 0;
  
  let delay = 0;
  switch (type) {
    case 'immediate':
      delay = 0;
      break;
    case 'linear':
      delay = baseDelayMs * attempt;
      break;
    case 'exponential':
    case 'exponential_backoff':
      delay = baseDelayMs * Math.pow(2, attempt - 1);
      break;
    case 'exponential_jitter':
    default:
      // Exponential backoff + random jitter
      const exp = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.random() * baseDelayMs;
      delay = exp + jitter;
      break;
  }

  return Math.min(delay, maxDelayMs);
}

/**
 * Determine if request is eligible for retry based on method and policy
 * @param {string} method HTTP request method (GET, POST, etc.)
 * @param {Object} policy Retry policy configuration
 * @returns {boolean}
 */
function isEligibleForRetry(method, policy = {}) {
  const m = method.toUpperCase();
  
  // Idempotent methods are eligible by default
  if (['GET', 'HEAD', 'OPTIONS'].includes(m)) {
    return true;
  }

  // Allow explicit overrides for POST, PUT, DELETE etc. if configured
  if (policy.retry_on_non_idempotent) {
    return true;
  }

  return false;
}

module.exports = {
  calculateBackoff,
  isEligibleForRetry
};
