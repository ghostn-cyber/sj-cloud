const crypto = require('crypto');

class WebhookSecurity {
  validateSignature(payload, signature, secret) {
    if (!secret) return true; // If no secret configured, allow (optional mode)
    if (!signature) return false;
    
    // GitHub signature is prepended with "sha256="
    const cleanSignature = signature.replace('sha256=', '');
    
    const hmac = crypto.createHmac('sha256', secret);
    const bodyStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const computed = hmac.update(bodyStr).digest('hex');
    
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(cleanSignature));
  }

  validateTimestamp(timestampStr) {
    if (!timestampStr) return true;
    const requestTime = new Date(timestampStr);
    const now = new Date();
    const diff = Math.abs(now.getTime() - requestTime.getTime());
    // Block requests older than 5 minutes (300,000 ms)
    return diff <= 300000;
  }
}

const globalWebhookSecurity = new WebhookSecurity();

module.exports = {
  WebhookSecurity,
  globalWebhookSecurity
};
