const fs = require('fs');
const path = require('path');
const RegistryBackend = require('./backend-interface');

class FilesystemBackend extends RegistryBackend {
  /**
   * @param {string} configDir Directory to scan for service definitions
   */
  constructor(configDir) {
    super();
    this.configDir = configDir;
  }

  async loadRawConfigs() {
    if (!fs.existsSync(this.configDir)) {
      throw new Error(`Config directory does not exist: ${this.configDir}`);
    }

    const files = fs.readdirSync(this.configDir);
    const configs = [];

    for (const file of files) {
      if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        if (file === 'snapshot.json') continue;
        
        const filePath = path.join(this.configDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const id = path.basename(file, path.extname(file));

        configs.push({
          id,
          content,
          format: 'yaml',
          filePath
        });
      }
    }

    return configs;
  }
}

module.exports = FilesystemBackend;
