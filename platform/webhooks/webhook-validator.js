class WebhookValidator {
  validate(payload) {
    if (!payload) return false;
    // Standard git payload fields
    if (!payload.repository || !payload.ref) {
      // Allow custom triggers or manual inputs if they carry essential fields
      if (!payload.event_type && !payload.branch) {
        return false;
      }
    }
    return true;
  }
}

const globalWebhookValidator = new WebhookValidator();

module.exports = {
  WebhookValidator,
  globalWebhookValidator
};
