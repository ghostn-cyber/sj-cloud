const yaml = require('js-yaml');

class RegistryLoader {
  /**
   * @param {RegistryBackend} backend The backend instance to load raw configs from
   */
  constructor(backend) {
    this.backend = backend;
  }

  /**
   * Load and parse all service definitions
   * @returns {Promise<Array<{id: string, filePath: string, config: Object}>>}
   */
  async load() {
    const rawConfigs = await this.backend.loadRawConfigs();
    const loaded = [];

    for (const raw of rawConfigs) {
      try {
        let parsed;
        if (raw.format === 'yaml') {
          parsed = yaml.load(raw.content);
        } else if (raw.format === 'json') {
          parsed = JSON.parse(raw.content);
        } else {
          throw new Error(`Unsupported configuration format: ${raw.format}`);
        }

        loaded.push({
          id: raw.id,
          filePath: raw.filePath,
          config: parsed
        });
      } catch (err) {
        throw new Error(`Failed to parse configuration for service "${raw.id}" at ${raw.filePath || 'unknown'}: ${err.message}`);
      }
    }

    return loaded;
  }
}

module.exports = {
  RegistryLoader
};
