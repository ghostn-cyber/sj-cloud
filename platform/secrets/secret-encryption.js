const crypto = require('crypto');

class SecretEncryption {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.key = process.env.PLATFORM_SECRET_KEY || 'default-secret-key-32-chars-long!';
    // Enforce 32 bytes key length
    if (this.key.length < 32) {
      this.key = this.key.padEnd(32, '0').substr(0, 32);
    } else if (this.key.length > 32) {
      this.key = this.key.substr(0, 32);
    }
  }

  encrypt(text) {
    if (!text) return '';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decrypt(encryptedText) {
    if (!encryptedText) return '';
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Return plain text if not encrypted (for fallback/test simplicity)
      return encryptedText;
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

const globalSecretEncryption = new SecretEncryption();

module.exports = {
  SecretEncryption,
  globalSecretEncryption
};
