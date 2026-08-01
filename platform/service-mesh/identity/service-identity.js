class ServiceIdentity {
  constructor(params = {}) {
    this.serviceId = params.serviceId || 'unknown';
    this.namespace = params.namespace || 'default';
    this.environment = params.environment || 'production';
    this.version = params.version || '1.0.0';
    this.owner = params.owner || 'unknown';
    this.trustLevel = params.trustLevel || 'low'; // 'high', 'medium', 'low'
    this.capabilities = params.capabilities || [];
    this.labels = params.labels || {};
    this.metadata = params.metadata || {};
  }

  getSPIFFEID() {
    return `spiffe://sjcloud.io/ns/${this.namespace}/sa/${this.serviceId}`;
  }

  toJSON() {
    return {
      serviceId: this.serviceId,
      namespace: this.namespace,
      environment: this.environment,
      version: this.version,
      owner: this.owner,
      trustLevel: this.trustLevel,
      capabilities: this.capabilities,
      labels: this.labels,
      metadata: this.metadata,
      spiffeId: this.getSPIFFEID()
    };
  }
}

module.exports = ServiceIdentity;
