class RegistryBackend {
  /**
   * Load raw configuration strings for all services
   * @returns {Promise<Array<{id: string, content: string, format: string}>>}
   */
  async loadRawConfigs() {
    throw new Error('Method loadRawConfigs() must be implemented');
  }
}

module.exports = RegistryBackend;
