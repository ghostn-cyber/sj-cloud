class NetworkContext {
  constructor(domains, port, tls) {
    this.domains = Object.freeze([ ...(domains || []) ]);
    this.port = port || 80;
    this.tls = tls !== false;
    Object.freeze(this);
  }
}

module.exports = { NetworkContext };
